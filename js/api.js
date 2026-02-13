import { CONFIG } from './config.js';
import { retryWithBackoff, shouldRetryAPIError } from './utils/retry_utils.js';

export async function callQwenAPI(prompt, images = null, apiKey = null, signal = null, modelOverride = null) {
    // 使用重试机制包装API调用
    return retryWithBackoff(
        async () => {
            return await callQwenAPIInternal(prompt, images, apiKey, signal, modelOverride);
        },
        3, // maxRetries
        1000, // baseDelay
        shouldRetryAPIError
    );
}

async function callQwenAPIInternal(prompt, images = null, apiKey = null, signal = null, modelOverride = null) {
    // 构建请求体
    let messages;

    if (images) {
        messages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }
        ];

        // Normalize to array
        const imageList = Array.isArray(images) ? images : [images];

        imageList.forEach(base64 => {
            messages[0].content.push({
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                }
            });
        });
    } else {
        // Text-only request
        messages = [
            {
                role: "user",
                content: prompt
            }
        ];
    }

    // Determine Model
    let targetModel = modelOverride;
    if (!targetModel) {
        if (images) {
            targetModel = "qwen-vl-max";
        } else {
            // Default text model from settings or fallback
            try {
                const apiBase = CONFIG.API_BASE_URL || '';
                const res = await fetch(`${apiBase}/api/settings/model`);
                const data = await res.json();
                targetModel = data.model || "qwen-plus";
            } catch (e) {
                targetModel = "qwen-plus";
            }
        }
    }

    const requestBody = {
        model: targetModel,
        messages: messages,
        max_tokens: 4000
    };

    // Retry configuration
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 300000; // 300 seconds (5 minutes) timeout for large image analysis

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        // Handle external abort signal
        const onAbort = () => controller.abort();
        if (signal) {
            if (signal.aborted) {
                clearTimeout(timeoutId);
                throw new Error("用户取消操作");
            }
            signal.addEventListener('abort', onAbort);
        }

        try {
            // 发送请求
            const headers = {
                'Content-Type': 'application/json'
            };

            // Only add header if apiKey is explicitly provided (legacy or override)
            // Otherwise server.py will inject it from DB
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch((CONFIG.API_BASE_URL || '') + CONFIG.API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);

            if (!response.ok) {
                let errorText = "";
                try {
                    errorText = await response.text();
                } catch (e) { } // ignore read error

                console.error(`API Error Response (Attempt ${attempt + 1}):`, errorText);

                // If it's a 5xx error, retry
                if (response.status >= 500 && attempt < MAX_RETRIES) {
                    console.warn(`Server error ${response.status}, retrying...`);
                    await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); // Exponential backoffish
                    continue;
                }

                // Enhanced Error Handling
                let errorMessage = `API Error (${response.status})`;
                if (response.status === 401) {
                    errorMessage = "认证失败：请检查 API Key 设置";
                } else if (response.status === 403) {
                    errorMessage = "权限拒绝：API Key 可能无效或余额不足";
                } else if (response.status === 504) {
                    errorMessage = "请求超时：服务器响应过慢";
                } else {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error) {
                            errorMessage += `: ${errorData.error.message || ''}`;
                        } else if (errorData.message) {
                            errorMessage += `: ${errorData.message}`;
                        }
                    } catch (e) {
                        errorMessage += errorText ? `: ${errorText.substring(0, 100)}` : "";
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            } else {
                throw new Error("API返回格式异常");
            }

        } catch (error) {
            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);

            // Handle Network Errors specifically
            if (error.name === 'AbortError') {
                if (signal && signal.aborted) {
                    throw new Error("用户取消操作");
                }
                if (attempt < MAX_RETRIES) {
                    console.warn(`Timeout, retrying...`);
                    continue;
                }
                throw new Error("请求超时，请检查网络连接");
            }

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                if (attempt < MAX_RETRIES) {
                    console.warn(`Network error, retrying...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                throw new Error("网络连接失败，请检查本地服务是否正常运行 (python server.py)");
            }

            if (attempt === MAX_RETRIES) {
                throw error;
            }
        }
    }
}
