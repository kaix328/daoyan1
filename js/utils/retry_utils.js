/**
 * 重试工具模块 - 提供指数退避重试策略
 */

/**
 * 指数退避重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} baseDelay - 基础延迟时间（毫秒）
 * @param {Function} shouldRetry - 判断是否应该重试的函数
 * @returns {Promise<any>} 函数执行结果
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, shouldRetry = null) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries - 1) {
                // 最后一次尝试失败，抛出原始错误
                throw error;
            }
            
            // 判断是否应该重试
            if (shouldRetry && !shouldRetry(error)) {
                throw error;
            }
            
            // 计算退避延迟时间（指数增长）
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`尝试 ${attempt + 1} 失败: ${error.message}，将在 ${delay}ms 后重试`);
            
            // 等待延迟时间
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * 网络错误重试策略
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function shouldRetryNetworkError(error) {
    // 重试网络相关错误
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('timeout') ||
        error.message.includes('Timeout')) {
        return true;
    }
    
    // 重试5xx服务器错误
    if (error.message.includes('API Error (5') ||
        error.message.includes('API Error (504)')) {
        return true;
    }
    
    return false;
}

/**
 * API错误重试策略
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function shouldRetryAPIError(error) {
    // 不重试认证错误
    if (error.message.includes('认证失败') || 
        error.message.includes('权限拒绝') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
        return false;
    }
    
    // 重试其他API错误
    return shouldRetryNetworkError(error);
}

/**
 * 图片生成错误重试策略
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function shouldRetryImageGenError(error) {
    // 重试图片生成失败（可能是临时问题）
    if (error.message.includes('Image Gen Failed') ||
        error.message.includes('生成失败') ||
        error.message.includes('timeout')) {
        return true;
    }
    
    return shouldRetryNetworkError(error);
}

/**
 * 延迟函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}