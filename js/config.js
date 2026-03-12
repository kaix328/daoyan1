export const CONFIG = {
    // API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', // Direct (CORS issue)
    API_URL: '/api/proxy', // Local Proxy
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
    LARGE_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    LOCAL_STORAGE_KEY: 'storyboard_api_key',
    // API基础URL配置 - 当使用HTTP服务器端口时，转发到Flask服务器
    API_BASE_URL: (window.location.port && window.location.port !== '5173') ? 'http://127.0.0.1:5173' : ''
};
