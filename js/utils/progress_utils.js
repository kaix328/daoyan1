/**
 * 进度指示器工具模块
 * 提供实时进度显示和管理功能
 */

/**
 * 进度管理器类
 */
export class ProgressManager {
    constructor() {
        this.activeProgressBars = new Map();
        this.progressContainer = null;
        this.init();
    }

    /**
     * 初始化进度容器
     */
    init() {
        // 创建全局进度容器
        this.progressContainer = document.createElement('div');
        this.progressContainer.id = 'global-progress-container';
        this.progressContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
        `;
        document.body.appendChild(this.progressContainer);
    }

    /**
     * 创建新的进度条
     * @param {string} id - 进度条ID
     * @param {string} title - 进度条标题
     * @param {number} total - 总步骤数
     * @returns {ProgressBar} 进度条实例
     */
    createProgressBar(id, title, total = 100) {
        const progressBar = new ProgressBar(id, title, total, this);
        this.activeProgressBars.set(id, progressBar);
        return progressBar;
    }

    /**
     * 获取进度条
     * @param {string} id - 进度条ID
     * @returns {ProgressBar|null} 进度条实例
     */
    getProgressBar(id) {
        return this.activeProgressBars.get(id) || null;
    }

    /**
     * 移除进度条
     * @param {string} id - 进度条ID
     */
    removeProgressBar(id) {
        const progressBar = this.activeProgressBars.get(id);
        if (progressBar) {
            progressBar.destroy();
            this.activeProgressBars.delete(id);
        }
    }

    /**
     * 清除所有进度条
     */
    clearAll() {
        this.activeProgressBars.forEach(progressBar => progressBar.destroy());
        this.activeProgressBars.clear();
    }
}

/**
 * 进度条类
 */
class ProgressBar {
    constructor(id, title, total, manager) {
        this.id = id;
        this.title = title;
        this.total = total;
        this.current = 0;
        this.status = 'pending'; // pending, running, completed, failed
        this.startTime = Date.now();
        this.manager = manager;
        this.element = null;
        this.createElement();
    }

    /**
     * 创建进度条DOM元素
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'progress-item';
        this.element.id = `progress-${this.id}`;
        this.element.style.cssText = `
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        `;

        this.element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 500; font-size: 14px;">${this.title}</span>
                <span id="progress-status-${this.id}" style="font-size: 12px; color: #666;">等待中...</span>
            </div>
            <div style="position: relative; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden;">
                <div id="progress-bar-${this.id}" style="position: absolute; left: 0; top: 0; height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span id="progress-text-${this.id}" style="font-size: 12px; color: #999;">0/${this.total}</span>
                <span id="progress-time-${this.id}" style="font-size: 12px; color: #999;">--:--</span>
            </div>
        `;

        this.manager.progressContainer.appendChild(this.element);
    }

    /**
     * 更新进度
     * @param {number} current - 当前步骤
     * @param {string} message - 进度消息
     */
    update(current, message = '') {
        this.current = current;
        const percentage = Math.round((current / this.total) * 100);

        // 更新进度条
        const progressBar = this.element.querySelector(`#progress-bar-${this.id}`);
        progressBar.style.width = `${percentage}%`;

        // 更新文本
        const progressText = this.element.querySelector(`#progress-text-${this.id}`);
        progressText.textContent = message || `${current}/${this.total}`;

        // 更新时间
        this.updateTime();

        // 更新状态
        if (current >= this.total && this.status !== 'completed') {
            this.complete();
        }
    }

    /**
     * 更新进度消息
     * @param {string} message - 进度消息
     */
    updateMessage(message) {
        const progressText = this.element.querySelector(`#progress-text-${this.id}`);
        progressText.textContent = message;
    }

    /**
     * 更新时间显示
     */
    updateTime() {
        const elapsed = Date.now() - this.startTime;
        const timeText = this.element.querySelector(`#progress-time-${this.id}`);
        timeText.textContent = this.formatTime(elapsed);
    }

    /**
     * 开始进度条
     */
    start() {
        this.status = 'running';
        const statusElement = this.element.querySelector(`#progress-status-${this.id}`);
        statusElement.textContent = '进行中...';
        statusElement.style.color = '#667eea';
    }

    /**
     * 完成进度条
     */
    complete() {
        if (this.status === 'completed') return;
        this.status = 'completed';

        // Manually update to 100% to avoid recursion loop with update()
        this.current = this.total;

        if (this.element) {
            const progressBar = this.element.querySelector(`#progress-bar-${this.id}`);
            if (progressBar) progressBar.style.width = '100%';

            const progressText = this.element.querySelector(`#progress-text-${this.id}`);
            if (progressText) progressText.textContent = `${this.total}/${this.total}`;

            this.updateTime();

            const statusElement = this.element.querySelector(`#progress-status-${this.id}`);
            if (statusElement) {
                statusElement.textContent = '已完成 ✓';
                statusElement.style.color = '#52c41a';
            }

            // 添加完成动画
            this.element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                if (this.element) this.element.style.transform = 'scale(1)';
            }, 200);

            // 3秒后自动移除
            setTimeout(() => {
                this.destroy();
                if (this.manager && this.manager.activeProgressBars) {
                    this.manager.activeProgressBars.delete(this.id);
                }
            }, 3000);
        }
    }

    /**
     * 失败进度条
     * @param {string} error - 错误消息
     */
    fail(error = '') {
        this.status = 'failed';

        const statusElement = this.element.querySelector(`#progress-status-${this.id}`);
        statusElement.textContent = '失败 ✗';
        statusElement.style.color = '#ff4757';

        const progressBar = this.element.querySelector(`#progress-bar-${this.id}`);
        progressBar.style.background = '#ff4757';

        if (error) {
            const progressText = this.element.querySelector(`#progress-text-${this.id}`);
            progressText.textContent = error;
            progressText.style.color = '#ff4757';
        }

        // 5秒后自动移除
        setTimeout(() => {
            this.destroy();
            this.manager.activeProgressBars.delete(this.id);
        }, 5000);
    }

    /**
     * 销毁进度条
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.style.opacity = '0';
            this.element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 300);
        }
    }

    /**
     * 格式化时间
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${remainingSeconds}s`;
        }
    }
}

/**
 * 批量进度管理器
 * 用于管理多个相关任务的进度
 */
export class BatchProgressManager {
    constructor(progressManager) {
        this.progressManager = progressManager;
        this.batchId = null;
        this.progressBar = null;
        this.items = [];
        this.completed = 0;
        this.failed = 0;
    }

    /**
     * 开始批量任务
     * @param {string} title - 任务标题
     * @param {Array} items - 任务项数组
     */
    startBatch(title, items) {
        this.batchId = `batch_${Date.now()}`;
        this.items = items;
        this.completed = 0;
        this.failed = 0;

        this.progressBar = this.progressManager.createProgressBar(
            this.batchId,
            title,
            items.length
        );

        this.progressBar.start();
        return this.batchId;
    }

    /**
     * 更新单个任务进度
     * @param {number} index - 任务索引
     * @param {string} status - 任务状态 (success, failed)
     * @param {string} message - 任务消息
     */
    updateItem(index, status, message = '') {
        if (status === 'success') {
            this.completed++;
        } else if (status === 'failed') {
            this.failed++;
        }

        const totalCompleted = this.completed + this.failed;
        const statusMessage = `已完成: ${this.completed}, 失败: ${this.failed}`;

        if (this.progressBar) {
            this.progressBar.update(totalCompleted, statusMessage);
        }

        if (totalCompleted >= this.items.length) {
            if (this.failed > 0) {
                this.progressBar.fail(`${this.failed} 个任务失败`);
            } else {
                this.progressBar.complete();
            }
        }
    }

    /**
     * 获取当前进度
     * @returns {Object} 进度信息
     */
    getProgress() {
        return {
            total: this.items.length,
            completed: this.completed,
            failed: this.failed,
            remaining: this.items.length - this.completed - this.failed,
            percentage: Math.round(((this.completed + this.failed) / this.items.length) * 100)
        };
    }
}

// 创建全局进度管理器实例
export const progressManager = new ProgressManager();