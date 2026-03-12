/**
 * 图片压缩和内存管理工具
 * 用于优化图片大小，减少内存占用
 */

/**
 * 压缩图片到指定质量
 * @param {string} base64Image - Base64格式的图片
 * @param {number} quality - 压缩质量 (0-1)
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<string>} 压缩后的Base64图片
 */
export async function compressImage(base64Image, quality = 0.8, maxWidth = 1024, maxHeight = 1024) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = function() {
            // 计算缩放比例
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            // 创建canvas进行压缩
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为压缩后的base64
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            // 清理资源
            canvas.width = 0;
            canvas.height = 0;
            img.src = '';
            
            resolve(compressedBase64);
        };
        
        img.onerror = function() {
            reject(new Error('图片加载失败'));
        };
        
        img.src = base64Image;
    });
}

/**
 * 获取图片文件大小（KB）
 * @param {string} base64Image - Base64格式的图片
 * @returns {number} 文件大小（KB）
 */
export function getImageSize(base64Image) {
    const base64Length = base64Image.length - base64Image.indexOf(',') - 1;
    const padding = base64Image.endsWith('==') ? 2 : base64Image.endsWith('=') ? 1 : 0;
    const fileSize = (base64Length * 0.75) - padding;
    return Math.round(fileSize / 1024); // 转换为KB
}

/**
 * 图片懒加载管理器
 */
export class ImageLazyLoader {
    constructor() {
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.observer = null;
        this.initIntersectionObserver();
    }

    /**
     * 初始化Intersection Observer
     */
    initIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px', // 提前50px开始加载
            threshold: 0.01
        });
    }

    /**
     * 加载图片
     * @param {HTMLElement} imgElement - 图片元素
     */
    async loadImage(imgElement) {
        const src = imgElement.dataset.src;
        if (!src || this.loadingImages.has(src)) return;

        this.loadingImages.add(src);

        try {
            // 检查缓存
            if (this.imageCache.has(src)) {
                imgElement.src = this.imageCache.get(src);
                this.loadingImages.delete(src);
                return;
            }

            // 如果是base64图片，直接加载
            if (src.startsWith('data:')) {
                imgElement.src = src;
                this.imageCache.set(src, src);
                this.loadingImages.delete(src);
                return;
            }

            // 加载图片
            const img = new Image();
            img.onload = () => {
                imgElement.src = src;
                this.imageCache.set(src, src);
                this.loadingImages.delete(src);
                imgElement.classList.add('loaded');
            };

            img.onerror = () => {
                console.error('图片加载失败:', src);
                this.loadingImages.delete(src);
                imgElement.classList.add('error');
            };

            img.src = src;
        } catch (error) {
            console.error('加载图片时出错:', error);
            this.loadingImages.delete(src);
            imgElement.classList.add('error');
        }
    }

    /**
     * 注册图片元素进行懒加载
     * @param {HTMLElement} imgElement - 图片元素
     */
    observe(imgElement) {
        if (!imgElement.dataset.src) {
            // 如果没有data-src，将src移到data-src
            if (imgElement.src) {
                imgElement.dataset.src = imgElement.src;
                imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNjY2MiLz48L3N2Zz4=';
            }
        }
        
        this.observer.observe(imgElement);
    }

    /**
     * 取消观察图片元素
     * @param {HTMLElement} imgElement - 图片元素
     */
    unobserve(imgElement) {
        this.observer.unobserve(imgElement);
    }

    /**
     * 清理缓存
     * @param {number} maxSize - 最大缓存大小（MB）
     */
    cleanup(maxSize = 50) {
        const maxBytes = maxSize * 1024 * 1024;
        let currentSize = 0;
        
        // 计算当前缓存大小
        for (const [src, data] of this.imageCache.entries()) {
            if (data.startsWith('data:')) {
                currentSize += getImageSize(data) * 1024;
            }
        }

        // 如果超过限制，清理最旧的条目
        if (currentSize > maxBytes) {
            const entriesToDelete = Math.ceil(this.imageCache.size * 0.3); // 清理30%
            const keys = Array.from(this.imageCache.keys()).slice(0, entriesToDelete);
            
            keys.forEach(key => {
                this.imageCache.delete(key);
            });

            console.log(`清理了 ${entriesToDelete} 个图片缓存条目`);
        }
    }

    /**
     * 销毁管理器
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.imageCache.clear();
        this.loadingImages.clear();
    }
}

/**
 * 内存监控器
 */
export class MemoryMonitor {
    constructor() {
        this.metrics = {
            imageCount: 0,
            totalImageSize: 0,
            cacheSize: 0,
            domNodes: 0,
            timestamp: Date.now()
        };
        this.updateInterval = null;
    }

    /**
     * 开始监控
     * @param {number} interval - 更新间隔（毫秒）
     */
    start(interval = 5000) {
        this.updateMetrics();
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, interval);
    }

    /**
     * 停止监控
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * 更新指标
     */
    updateMetrics() {
        const images = document.querySelectorAll('img');
        let totalSize = 0;
        let imageCount = 0;

        images.forEach(img => {
            if (img.src && img.src.startsWith('data:')) {
                const size = getImageSize(img.src);
                totalSize += size;
                imageCount++;
            }
        });

        this.metrics = {
            imageCount,
            totalImageSize: totalSize,
            cacheSize: performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 0,
            domNodes: document.querySelectorAll('*').length,
            timestamp: Date.now()
        };
    }

    /**
     * 获取内存指标
     * @returns {object} 内存指标
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 检查内存使用是否过高
     * @param {number} threshold - 阈值（MB）
     * @returns {boolean} 是否超过阈值
     */
    isMemoryHigh(threshold = 100) {
        return this.metrics.totalImageSize > threshold;
    }

    /**
     * 获取内存使用报告
     * @returns {string} 内存使用报告
     */
    getReport() {
        const metrics = this.getMetrics();
        return `
内存使用报告:
- 图片数量: ${metrics.imageCount}
- 图片总大小: ${metrics.totalImageSize.toFixed(2)} MB
- JS堆内存: ${metrics.cacheSize} MB
- DOM节点数: ${metrics.domNodes}
- 更新时间: ${new Date(metrics.timestamp).toLocaleTimeString()}
        `.trim();
    }
}

// 创建全局实例
export const imageLazyLoader = new ImageLazyLoader();
export const memoryMonitor = new MemoryMonitor();