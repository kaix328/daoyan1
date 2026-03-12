import { formatResult } from './utils.js';
import { LightingDiagram, FocalLengthSimulator } from './diagrams.js';

// DOM Elements
const progressContainer = document.getElementById('progressContainer');
const progressText = document.getElementById('progressText');
const resultStatus = document.getElementById('resultStatus');
const resultContent = document.getElementById('resultContent'); // Usually this is #analysisResult based on HTML but let's check
const resultTimestamp = document.getElementById('resultTimestamp'); // Might not exist in HTML, check usage
const copyResultBtn = document.getElementById('copyResultBtn');
const saveResultBtn = document.getElementById('saveResultBtn'); // Check ID
const musicContent = document.getElementById('musicContent');
const musicResult = document.getElementById('musicResult');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');

// Visualizers
let lightingDiagram = null;
let focalSim = null;

export function initVisualizers() {
    if (document.getElementById('lightingDiagram')) {
        lightingDiagram = new LightingDiagram('lightingDiagram');
    }
    // focalSim logic if needed
    // Bind Focal Buttons
    document.querySelectorAll('.focal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const focal = e.target.getAttribute('data-focal');
            if (focalSim) focalSim.simulate(focal);
            document.querySelectorAll('.focal-btn').forEach(b => b.classList.remove('btn-primary'));
            e.target.classList.add('btn-primary');
        });
    });
}

// UI Helper Functions

export function showProgress(text) {
    if (progressContainer) {
        progressContainer.style.display = 'block';
        if (progressText) progressText.textContent = text;
    }
}

export function hideProgress() {
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

export function toggleProgress(show, text) {
    if (show) {
        showProgress(text || '处理中...');
    } else {
        hideProgress();
    }
}

export function updateResultStatus(text, className) {
    if (resultStatus) {
        resultStatus.textContent = text;
        resultStatus.className = `status-badge ${className}`;
    }
}

// Toast Notification System
function createToast(message, type, icon) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

export function showSuccess(message) {
    createToast(message, 'success', 'fa-check-circle');
}

export function showError(message) {
    createToast(message, 'error', 'fa-exclamation-triangle');
}

export function showWarning(message) {
    createToast(message, 'info', 'fa-info-circle');
}

export function resetImagePreview() {
    if (previewImage) {
        previewImage.src = '';
    }
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.style.display = 'block';
    }
    if (imageInput) {
        imageInput.value = '';
    }
}

export function switchToResultTab(targetId) {
    const tabs = document.querySelectorAll('.result-tab-btn');
    const contents = document.querySelectorAll('.result-tab-content');
    
    tabs.forEach(t => {
        if (t.dataset.target === targetId) t.classList.add('active');
        else t.classList.remove('active');
    });
    
    contents.forEach(c => {
        if (c.id === targetId) {
            c.style.display = 'block';
            c.classList.add('active');
        } else {
            c.style.display = 'none';
            c.classList.remove('active');
        }
    });
}

export function displayResult(result, onReanalyze, onReport, imageSourceOverride = null) {
    const analysisResult = document.getElementById('analysisResult');
    if (analysisResult) {
        analysisResult.innerHTML = formatResult(result);
    }

    updateResultStatus('已完成', 'status-success');
    
    // Switch to Report Tab
    switchToResultTab('tab-report');
    
    // Enable buttons
    if (copyResultBtn) copyResultBtn.disabled = false;
    // if (saveResultBtn) saveResultBtn.disabled = false;

    // Render Diagrams
    const visualTools = document.getElementById('visualTools');
    if (visualTools) visualTools.style.display = 'grid';

    if (lightingDiagram) lightingDiagram.draw(result);

    // Verification buttons logic could go here if needed
}

export function clearResult() {
    const analysisResult = document.getElementById('analysisResult');
    if (analysisResult) {
        analysisResult.innerHTML = '<div class="empty-result"><i class="fas fa-film"></i><p>上传图片并点击分析以获取结果</p></div>';
    }
    updateResultStatus('Ready', 'status-ready');
    if (lightingDiagram) {
        const ctx = lightingDiagram.ctx;
        if (ctx) ctx.clearRect(0, 0, lightingDiagram.width, lightingDiagram.height);
    }
    const visualTools = document.getElementById('visualTools');
    if (visualTools) visualTools.style.display = 'none';
}

export function displayVideoPrompt(prompt) {
    const videoPromptResult = document.getElementById('videoPromptResult');
    const promptContent = document.getElementById('promptContent');

    if (promptContent) {
        // Extract positive prompt for easy copying
        let positivePrompt = prompt;
        const posMatch = prompt.match(/\*\*Positive Prompt:\*\*\s*([\s\S]*?)(?=\*\*Negative|$)/i);
        if (posMatch && posMatch[1]) {
            positivePrompt = posMatch[1].trim();
        }

        promptContent.innerHTML = `
            <div class="prompt-box">
                <pre>${prompt}</pre>
            </div>
            <div class="smart-copy-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                 <button class="btn btn-secondary btn-small copy-full-btn" data-text="${encodeURIComponent(prompt)}">
                    <i class="fas fa-copy"></i> 复制全部
                </button>
                <button class="btn btn-primary btn-small copy-mj-btn" data-text="${encodeURIComponent(positivePrompt)}">
                    <i class="fas fa-robot"></i> 复制提示词 (Only Prompt)
                </button>
            </div>
        `;
        
        // Bind copy events
        const fullBtn = promptContent.querySelector('.copy-full-btn');
        if (fullBtn) {
            fullBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(decodeURIComponent(fullBtn.dataset.text));
                showSuccess('完整提示词已复制');
            });
        }
        
        const mjBtn = promptContent.querySelector('.copy-mj-btn');
        if (mjBtn) {
            mjBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(decodeURIComponent(mjBtn.dataset.text));
                showSuccess('仅提示词已复制');
            });
        }
    }
    
    if (videoPromptResult) {
        videoPromptResult.style.display = 'block';
        switchToResultTab('tab-video-result');
        
        // Hide empty state
        const emptyState = document.getElementById('videoPromptEmpty');
        if (emptyState) emptyState.style.display = 'none';
    }
}

export function displayMusicAnalysis(analysis) {
    const musicResult = document.getElementById('musicResult');
    const musicContent = document.getElementById('musicContent');

    if (musicContent) {
        musicContent.innerHTML = `
            <div class="tool-result-content">
                <pre>${analysis}</pre>
            </div>
            <div class="smart-copy-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-secondary btn-small copy-music-btn" data-text="${encodeURIComponent(analysis)}">
                    <i class="fas fa-copy"></i> 复制全部
                </button>
            </div>
        `;

        const copyBtn = musicContent.querySelector('.copy-music-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(decodeURIComponent(copyBtn.dataset.text));
                showSuccess('音效分析已复制');
            });
        }
    }

    if (musicResult) {
        musicResult.style.display = 'block';
        switchToResultTab('tab-music-result');
        
        // Hide empty state
        const emptyState = document.getElementById('musicPromptEmpty');
        if (emptyState) emptyState.style.display = 'none';
    }
}

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Shows a custom input modal and returns a Promise that resolves with the input value
 * or null if cancelled.
 * @param {string} title - The modal title
 * @param {string} defaultValue - Default value for the input
 * @param {string} placeholder - Placeholder text
 * @returns {Promise<string|null>}
 */
export function showInputModal(title, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('inputModal');
        const titleEl = document.getElementById('inputModalTitle');
        const inputEl = document.getElementById('inputModalValue');
        const confirmBtn = document.getElementById('inputModalConfirmBtn');
        const cancelBtn = document.getElementById('inputModalCancelBtn');
        const closeSpan = modal.querySelector('.close');

        if (!modal || !inputEl || !confirmBtn || !cancelBtn) {
            console.error('Input modal elements missing');
            // Fallback to prompt if modal is broken, though this is what we are avoiding
            // But if elements are missing, we have no choice but to try prompt or return null
            // Since prompt() is broken in this environment, we log error and return null
             resolve(null);
            return;
        }

        titleEl.textContent = title;
        inputEl.value = defaultValue;
        inputEl.placeholder = placeholder;

        // Reset previous event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const newCloseSpan = closeSpan.cloneNode(true);
        closeSpan.parentNode.replaceChild(newCloseSpan, closeSpan);

        // Handler functions
        const cleanup = () => {
            modal.style.display = 'none';
            inputEl.value = ''; // Clear for security/cleanliness
        };

        const handleConfirm = () => {
            const value = inputEl.value;
            cleanup();
            resolve(value);
        };

        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        // Bind events
        newConfirmBtn.addEventListener('click', handleConfirm);
        newCancelBtn.addEventListener('click', handleCancel);
        newCloseSpan.addEventListener('click', handleCancel);

        // Allow Enter key to confirm
        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Show modal
        modal.style.display = 'block';
        inputEl.focus();
    });
}

/**
 * Shows a custom alert modal
 */
export function showMessage(message, title = '提示') {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageModalTitle');
        const textEl = document.getElementById('messageModalText');
        const confirmBtn = document.getElementById('messageModalConfirmBtn');
        const cancelBtn = document.getElementById('messageModalCancelBtn');
        const closeSpan = modal.querySelector('.close');

        if (!modal) {
            alert(message);
            resolve();
            return;
        }

        titleEl.textContent = title;
        textEl.textContent = message;
        cancelBtn.style.display = 'none';
        confirmBtn.textContent = '确定';

        const cleanup = () => {
            modal.style.display = 'none';
        };

        const handleConfirm = () => {
            cleanup();
            resolve();
        };

        // Reset listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        const newCloseSpan = closeSpan.cloneNode(true);
        closeSpan.parentNode.replaceChild(newCloseSpan, closeSpan);
        newCloseSpan.addEventListener('click', handleConfirm);

        modal.style.display = 'block';
        newConfirmBtn.focus();
    });
}

/**
 * Shows a custom confirm modal
 */
export function showConfirm(message, title = '确认') {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageModalTitle');
        const textEl = document.getElementById('messageModalText');
        const confirmBtn = document.getElementById('messageModalConfirmBtn');
        const cancelBtn = document.getElementById('messageModalCancelBtn');
        const closeSpan = modal.querySelector('.close');

        if (!modal) {
            resolve(confirm(message));
            return;
        }

        titleEl.textContent = title;
        textEl.textContent = message;
        cancelBtn.style.display = 'inline-block';
        confirmBtn.textContent = '确定';

        const cleanup = () => {
            modal.style.display = 'none';
        };

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        // Reset listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', handleCancel);
        
        const newCloseSpan = closeSpan.cloneNode(true);
        closeSpan.parentNode.replaceChild(newCloseSpan, closeSpan);
        newCloseSpan.addEventListener('click', handleCancel);

        modal.style.display = 'block';
        newConfirmBtn.focus();
    });
}






