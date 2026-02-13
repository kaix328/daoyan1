/**
 * LRU缓存实现
 * 用于缓存API调用结果，减少重复请求
 */

export class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map(); // 使用Map保持插入顺序
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 生成缓存键
     * @param {string} prefix - 键前缀
     * @param {any} params - 参数对象
     * @returns {string} 缓存键
     */
    static generateKey(prefix, params) {
        const sortedParams = JSON.stringify(params, Object.keys(params).sort());
        return `${prefix}:${sortedParams}`;
    }

    /**
     * 获取缓存值
     * @param {string} key - 缓存键
     * @returns {any|null} 缓存值
     */
    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            // 移动到最近使用的位置
            this.cache.delete(key);
            this.cache.set(key, value);
            this.hits++;
            return value;
        }
        this.misses++;
        return null;
    }

    /**
     * 设置缓存值
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒），可选
     */
    set(key, value, ttl = null) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最久未使用的项
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const cacheItem = { value, timestamp: Date.now() };
        if (ttl) {
            cacheItem.expiry = Date.now() + (ttl * 1000);
        }

        this.cache.set(key, cacheItem);
    }

    /**
     * 删除缓存项
     * @param {string} key - 缓存键
     * @returns {boolean} 是否删除成功
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 获取缓存统计信息
     * @returns {object} 统计信息
     */
    getStats() {
        const totalRequests = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: totalRequests > 0 ? (this.hits / totalRequests * 100).toFixed(2) : 0,
            missRate: totalRequests > 0 ? (this.misses / totalRequests * 100).toFixed(2) : 0
        };
    }

    /**
     * 检查并清理过期项
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.expiry && now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 获取所有缓存键
     * @returns {Array} 缓存键数组
     */
    keys() {
        return Array.from(this.cache.keys());
    }
}

/**
 * 脚本生成缓存管理器
 * 专门用于缓存脚本生成相关的结果
 */
export class ScriptCacheManager {
    constructor(options = {}) {
        // 可配置的缓存参数
        const config = {
            scriptCacheSize: options.scriptCacheSize || 150,      // 脚本缓存容量
            analysisCacheSize: options.analysisCacheSize || 100,  // 分析缓存容量
            visualizationCacheSize: options.visualizationCacheSize || 60, // 可视化缓存容量
            promptCacheSize: options.promptCacheSize || 120,      // 提示词缓存容量
            ...options
        };
        
        this.scriptCache = new LRUCache(config.scriptCacheSize);
        this.analysisCache = new LRUCache(config.analysisCacheSize);
        this.visualizationCache = new LRUCache(config.visualizationCacheSize);
        this.promptCache = new LRUCache(config.promptCacheSize);
        
        // 智能过期时间配置
        this.expiryConfig = {
            script: 3600,        // 1小时 - 脚本内容相对稳定
            analysis: 1800,      // 30分钟 - 分析结果可能较快过时
            visualization: 900,  // 15分钟 - 可视化偏好可能变化
            prompt: 7200         // 2小时 - 提示词模板相对稳定
        };
    }

    /**
     * 缓存脚本生成结果
     * @param {object} params - 生成参数
     * @param {string} result - 脚本内容
     */
    cacheScript(params, result) {
        const key = LRUCache.generateKey('script', params);
        this.scriptCache.set(key, result, this.expiryConfig.script);
    }

    /**
     * 获取缓存的脚本
     * @param {object} params - 生成参数
     * @returns {string|null} 缓存的脚本内容
     */
    getCachedScript(params) {
        const key = LRUCache.generateKey('script', params);
        const cacheItem = this.scriptCache.get(key);
        return cacheItem ? cacheItem.value : null;
    }

    /**
     * 缓存分析结果
     * @param {string} script - 脚本内容
     * @param {object} result - 分析结果
     */
    cacheAnalysis(script, result) {
        // 使用脚本的哈希值作为key，提高缓存命中率
        const scriptHash = this.generateScriptHash(script);
        const key = LRUCache.generateKey('analysis', { hash: scriptHash });
        this.analysisCache.set(key, result, this.expiryConfig.analysis);
    }

    /**
     * 获取缓存的分析结果
     * @param {string} script - 脚本内容
     * @returns {object|null} 缓存的分析结果
     */
    getCachedAnalysis(script) {
        const scriptHash = this.generateScriptHash(script);
        const key = LRUCache.generateKey('analysis', { hash: scriptHash });
        const cacheItem = this.analysisCache.get(key);
        return cacheItem ? cacheItem.value : null;
    }

    /**
     * 生成脚本内容的哈希值
     * @param {string} script - 脚本内容
     * @returns {string} 哈希值
     */
    generateScriptHash(script) {
        // 简单的哈希函数，用于生成脚本指纹
        let hash = 0;
        const trimmedScript = script.trim().replace(/\s+/g, ' '); // 标准化空白字符
        for (let i = 0; i < trimmedScript.length; i++) {
            const char = trimmedScript.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36); // 转换为36进制字符串
    }

    /**
     * 缓存可视化结果
     * @param {string} script - 脚本内容
     * @param {Array} result - 可视化数据
     */
    cacheVisualization(script, result) {
        const scriptHash = this.generateScriptHash(script);
        const key = LRUCache.generateKey('visualization', { hash: scriptHash });
        this.visualizationCache.set(key, result, this.expiryConfig.visualization);
    }

    /**
     * 获取缓存的可视化结果
     * @param {string} script - 脚本内容
     * @returns {Array|null} 缓存的可视化数据
     */
    getCachedVisualization(script) {
        const scriptHash = this.generateScriptHash(script);
        const key = LRUCache.generateKey('visualization', { hash: scriptHash });
        const cacheItem = this.visualizationCache.get(key);
        return cacheItem ? cacheItem.value : null;
    }

    /**
     * 缓存提示词生成结果
     * @param {object} params - 生成参数
     * @param {string} prompt - 提示词内容
     */
    cachePrompt(params, prompt) {
        const key = LRUCache.generateKey('prompt', params);
        this.promptCache.set(key, prompt, this.expiryConfig.prompt);
    }

    /**
     * 获取缓存的提示词
     * @param {object} params - 生成参数
     * @returns {string|null} 缓存的提示词内容
     */
    getCachedPrompt(params) {
        const key = LRUCache.generateKey('prompt', params);
        const cacheItem = this.promptCache.get(key);
        return cacheItem ? cacheItem.value : null;
    }

    /**
     * 获取所有缓存统计
     * @returns {object} 缓存统计信息
     */
    getStats() {
        return {
            script: this.scriptCache.getStats(),
            analysis: this.analysisCache.getStats(),
            visualization: this.visualizationCache.getStats(),
            prompt: this.promptCache.getStats()
        };
    }

    /**
     * 智能预加载常用内容到缓存
     * @param {Array} commonParams - 常用参数列表
     * @param {Function} loadFunction - 加载函数
     */
    async preloadCache(commonParams, loadFunction) {
        const preloadPromises = [];
        
        for (const params of commonParams) {
            // 检查是否已经缓存
            if (!this.getCachedScript(params)) {
                preloadPromises.push(
                    loadFunction(params).then(result => {
                        if (result) {
                            this.cacheScript(params, result);
                        }
                    }).catch(err => {
                        console.warn('预加载失败:', params, err);
                    })
                );
            }
        }
        
        // 并发执行预加载，但限制并发数量
        const batchSize = 3;
        for (let i = 0; i < preloadPromises.length; i += batchSize) {
            const batch = preloadPromises.slice(i, i + batchSize);
            await Promise.all(batch);
        }
    }

    /**
     * 获取缓存使用建议
     * @returns {Array} 优化建议
     */
    getCacheRecommendations() {
        const stats = this.getStats();
        const recommendations = [];
        
        // 分析各类型缓存的命中率
        const cacheTypes = ['script', 'analysis', 'visualization', 'prompt'];
        
        cacheTypes.forEach(type => {
            const stat = stats[type];
            if (stat && stat.hits + stat.misses > 0) {
                const hitRate = stat.hits / (stat.hits + stat.misses);
                
                if (hitRate < 0.3) {
                    recommendations.push({
                        type: type,
                        hitRate: hitRate,
                        suggestion: `${type}缓存命中率较低(${(hitRate * 100).toFixed(1)}%)，建议增加缓存容量或优化缓存策略`
                    });
                }
                
                if (stat.evictions > stat.hits * 0.1) {
                    recommendations.push({
                        type: type,
                        evictions: stat.evictions,
                        suggestion: `${type}缓存频繁被替换(${stat.evictions}次)，建议增加缓存容量`
                    });
                }
            }
        });
        
        return recommendations;
    }

    /**
     * 清理所有缓存
     */
    clearAll() {
        this.scriptCache.clear();
        this.analysisCache.clear();
        this.visualizationCache.clear();
        this.promptCache.clear();
    }
}

// 创建全局缓存管理器实例
export const scriptCache = new ScriptCacheManager();