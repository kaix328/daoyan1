/**
 * 性能监控工具
 * 提供性能指标收集、分析和报告功能
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            apiCalls: [],
            imageGeneration: [],
            scriptGeneration: [],
            memoryUsage: [],
            cacheHits: 0,
            cacheMisses: 0,
            errors: []
        };
        this.startTime = Date.now();
        this.isEnabled = true;
        
        // 初始化性能监控
        this.init();
    }
    
    init() {
        // 监听页面卸载事件，保存性能数据
        window.addEventListener('beforeunload', () => {
            this.saveMetrics();
        });
        
        // 定期清理旧数据
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60000); // 每分钟清理一次
    }
    
    /**
     * 记录API调用性能
     */
    recordAPICall(endpoint, duration, success, error = null) {
        if (!this.isEnabled) return;
        
        this.metrics.apiCalls.push({
            endpoint,
            duration,
            success,
            error: error ? error.message : null,
            timestamp: Date.now()
        });
        
        if (!success && error) {
            this.recordError('API_CALL', error, { endpoint });
        }
    }
    
    /**
     * 记录图片生成性能
     */
    recordImageGeneration(duration, success, size = null, error = null) {
        if (!this.isEnabled) return;
        
        this.metrics.imageGeneration.push({
            duration,
            success,
            size,
            error: error ? error.message : null,
            timestamp: Date.now()
        });
        
        if (!success && error) {
            this.recordError('IMAGE_GENERATION', error);
        }
    }
    
    /**
     * 记录脚本生成性能
     */
    recordScriptGeneration(duration, success, length = null, error = null) {
        if (!this.isEnabled) return;
        
        this.metrics.scriptGeneration.push({
            duration,
            success,
            length,
            error: error ? error.message : null,
            timestamp: Date.now()
        });
        
        if (!success && error) {
            this.recordError('SCRIPT_GENERATION', error);
        }
    }
    
    /**
     * 记录内存使用情况
     */
    recordMemoryUsage(used, total, type = 'general') {
        if (!this.isEnabled) return;
        
        this.metrics.memoryUsage.push({
            used,
            total,
            percentage: (used / total) * 100,
            type,
            timestamp: Date.now()
        });
    }
    
    /**
     * 记录缓存命中/未命中
     */
    recordCacheHit() {
        if (this.isEnabled) {
            this.metrics.cacheHits++;
        }
    }
    
    recordCacheMiss() {
        if (this.isEnabled) {
            this.metrics.cacheMisses++;
        }
    }
    
    /**
     * 记录错误
     */
    recordError(type, error, context = {}) {
        if (!this.isEnabled) return;
        
        this.metrics.errors.push({
            type,
            message: error.message || error,
            stack: error.stack,
            context,
            timestamp: Date.now()
        });
    }
    
    /**
     * 获取性能摘要
     */
    getPerformanceSummary() {
        const now = Date.now();
        const sessionDuration = now - this.startTime;
        
        // 计算平均响应时间
        const avgApiTime = this.calculateAverage(this.metrics.apiCalls, 'duration');
        const avgImageTime = this.calculateAverage(this.metrics.imageGeneration, 'duration');
        const avgScriptTime = this.calculateAverage(this.metrics.scriptGeneration, 'duration');
        
        // 计算成功率
        const apiSuccessRate = this.calculateSuccessRate(this.metrics.apiCalls);
        const imageSuccessRate = this.calculateSuccessRate(this.metrics.imageGeneration);
        const scriptSuccessRate = this.calculateSuccessRate(this.metrics.scriptGeneration);
        
        // 缓存命中率
        const totalCacheOps = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = totalCacheOps > 0 ? (this.metrics.cacheHits / totalCacheOps) * 100 : 0;
        
        return {
            sessionDuration,
            apiCalls: {
                total: this.metrics.apiCalls.length,
                avgDuration: avgApiTime,
                successRate: apiSuccessRate
            },
            imageGeneration: {
                total: this.metrics.imageGeneration.length,
                avgDuration: avgImageTime,
                successRate: imageSuccessRate
            },
            scriptGeneration: {
                total: this.metrics.scriptGeneration.length,
                avgDuration: avgScriptTime,
                successRate: scriptSuccessRate
            },
            cache: {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                hitRate: cacheHitRate
            },
            errors: {
                total: this.metrics.errors.length,
                recent: this.metrics.errors.slice(-5) // 最近5个错误
            }
        };
    }
    
    /**
     * 获取详细性能报告
     */
    getDetailedReport() {
        const summary = this.getPerformanceSummary();
        
        return {
            ...summary,
            rawMetrics: this.metrics,
            recommendations: this.generateRecommendations(summary),
            timestamp: Date.now()
        };
    }
    
    /**
     * 生成性能优化建议
     */
    generateRecommendations(summary) {
        const recommendations = [];
        
        // API性能建议
        if (summary.apiCalls.avgDuration > 5000) {
            recommendations.push({
                type: 'PERFORMANCE',
                category: 'API',
                message: 'API响应时间较长，建议优化网络请求或增加缓存策略',
                priority: 'high'
            });
        }
        
        if (summary.apiCalls.successRate < 0.9) {
            recommendations.push({
                type: 'RELIABILITY',
                category: 'API',
                message: 'API成功率较低，建议检查网络连接或API服务状态',
                priority: 'high'
            });
        }
        
        // 图片生成建议
        if (summary.imageGeneration.avgDuration > 30000) {
            recommendations.push({
                type: 'PERFORMANCE',
                category: 'IMAGE_GENERATION',
                message: '图片生成时间过长，建议调整并发数或优化图片尺寸',
                priority: 'medium'
            });
        }
        
        // 缓存建议
        if (summary.cache.hitRate < 0.3) {
            recommendations.push({
                type: 'PERFORMANCE',
                category: 'CACHE',
                message: `缓存命中率较低(${(summary.cache.hitRate * 100).toFixed(1)}%)，建议优化缓存策略或增加缓存容量`,
                priority: 'high',
                details: {
                    hits: summary.cache.hits,
                    misses: summary.cache.misses,
                    hitRate: summary.cache.hitRate,
                    suggestion: '考虑增加缓存容量、优化缓存键生成策略或延长缓存过期时间'
                }
            });
        }
        
        // 如果缓存命中率极低，提供更详细的建议
        if (summary.cache.hitRate < 0.1 && summary.cache.hits + summary.cache.misses > 20) {
            recommendations.push({
                type: 'PERFORMANCE',
                category: 'CACHE',
                message: '缓存命中率极低，建议立即优化缓存配置',
                priority: 'critical',
                details: {
                    hits: summary.cache.hits,
                    misses: summary.cache.misses,
                    hitRate: summary.cache.hitRate,
                    suggestion: '1. 增加缓存容量 2. 检查缓存键生成逻辑 3. 延长缓存过期时间 4. 考虑使用更智能的缓存策略'
                }
            });
        }
        
        // 错误建议
        if (summary.errors.total > 10) {
            recommendations.push({
                type: 'RELIABILITY',
                category: 'ERROR_HANDLING',
                message: '错误数量较多，建议加强错误处理和重试机制',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
    
    /**
     * 计算平均值
     */
    calculateAverage(data, field) {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
        return sum / data.length;
    }
    
    /**
     * 计算成功率
     */
    calculateSuccessRate(data) {
        if (data.length === 0) return 1;
        const successCount = data.filter(item => item.success).length;
        return successCount / data.length;
    }
    
    /**
     * 获取详细的缓存性能分析
     */
    getDetailedCacheAnalysis() {
        const cacheStats = this.metrics.cacheHits && this.metrics.cacheMisses ? {
            totalHits: this.metrics.cacheHits.reduce((sum, item) => sum + (item.count || 1), 0),
            totalMisses: this.metrics.cacheMisses.reduce((sum, item) => sum + (item.count || 1), 0),
            hourlyTrend: this.getHourlyCacheTrend()
        } : null;
        
        if (!cacheStats) return null;
        
        const total = cacheStats.totalHits + cacheStats.totalMisses;
        const hitRate = total > 0 ? cacheStats.totalHits / total : 0;
        
        return {
            overall: {
                hitRate: hitRate,
                hitRatePercentage: (hitRate * 100).toFixed(1),
                totalOperations: total,
                efficiency: this.getCacheEfficiencyRating(hitRate)
            },
            trends: cacheStats.hourlyTrend,
            recommendations: this.generateCacheRecommendations(hitRate, total)
        };
    }
    
    /**
     * 获取缓存效率评级
     */
    getCacheEfficiencyRating(hitRate) {
        if (hitRate >= 0.7) return '优秀';
        if (hitRate >= 0.5) return '良好';
        if (hitRate >= 0.3) return '一般';
        if (hitRate >= 0.1) return '较差';
        return '很差';
    }
    
    /**
     * 获取小时级缓存趋势
     */
    getHourlyCacheTrend() {
        const hourlyData = {};
        const now = Date.now();
        
        // 处理缓存命中数据
        if (this.metrics.cacheHits) {
            this.metrics.cacheHits.forEach(item => {
                const hour = new Date(item.timestamp).getHours();
                if (!hourlyData[hour]) hourlyData[hour] = { hits: 0, misses: 0 };
                hourlyData[hour].hits += (item.count || 1);
            });
        }
        
        // 处理缓存未命中数据
        if (this.metrics.cacheMisses) {
            this.metrics.cacheMisses.forEach(item => {
                const hour = new Date(item.timestamp).getHours();
                if (!hourlyData[hour]) hourlyData[hour] = { hits: 0, misses: 0 };
                hourlyData[hour].misses += (item.count || 1);
            });
        }
        
        return Object.keys(hourlyData).map(hour => ({
            hour: parseInt(hour),
            hitRate: hourlyData[hour].hits / (hourlyData[hour].hits + hourlyData[hour].misses),
            operations: hourlyData[hour].hits + hourlyData[hour].misses
        })).sort((a, b) => a.hour - b.hour);
    }
    
    /**
     * 生成缓存优化建议
     */
    generateCacheRecommendations(hitRate, totalOperations) {
        const recommendations = [];
        
        if (hitRate < 0.3) {
            recommendations.push({
                priority: 'high',
                category: 'capacity',
                message: '缓存容量可能不足，建议增加缓存大小',
                action: '考虑将各类缓存容量增加50-100%'
            });
        }
        
        if (totalOperations > 100 && hitRate < 0.5) {
            recommendations.push({
                priority: 'medium',
                category: 'strategy',
                message: '缓存策略可能需要优化',
                action: '1. 优化缓存键生成算法 2. 调整过期时间 3. 考虑使用预加载策略'
            });
        }
        
        return recommendations;
    }
    
    /**
     * 清理旧指标数据
     */
    cleanupOldMetrics() {
        const cutoff = Date.now() - 3600000; // 1小时前
        
        Object.keys(this.metrics).forEach(key => {
            if (Array.isArray(this.metrics[key])) {
                this.metrics[key] = this.metrics[key].filter(item => 
                    item.timestamp > cutoff
                );
            }
        });
    }
    
    /**
     * 保存指标到本地存储
     */
    saveMetrics() {
        try {
            const data = {
                metrics: this.metrics,
                timestamp: Date.now()
            };
            localStorage.setItem('performance_metrics', JSON.stringify(data));
        } catch (e) {
            console.warn('无法保存性能指标:', e);
        }
    }
    
    /**
     * 从本地存储加载指标
     */
    loadMetrics() {
        try {
            const data = localStorage.getItem('performance_metrics');
            if (data) {
                const parsed = JSON.parse(data);
                // 只加载最近的数据
                if (Date.now() - parsed.timestamp < 86400000) { // 24小时内
                    this.metrics = parsed.metrics;
                }
            }
        } catch (e) {
            console.warn('无法加载性能指标:', e);
        }
    }
    
    /**
     * 启用/禁用监控
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
    
    /**
     * 重置所有指标
     */
    reset() {
        this.metrics = {
            apiCalls: [],
            imageGeneration: [],
            scriptGeneration: [],
            memoryUsage: [],
            cacheHits: 0,
            cacheMisses: 0,
            errors: []
        };
        this.startTime = Date.now();
    }
    
    /**
     * 导出性能报告
     */
    exportReport() {
        const report = this.getDetailedReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_report_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();