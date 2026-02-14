import { SCRIPT_CATEGORIES, PLATFORM_STYLES, NARRATIVE_MODELS, VISUAL_STYLES, PACING_MODES, VIRAL_HOOKS, CTA_TYPES, CASTING_OPTIONS, CINEMATOGRAPHY_SPECS, SOUND_DESIGN } from './script_presets.js';
import * as API from '../api.js';
import * as UI from '../ui.js';
import * as Utils from '../utils.js';
import { CONFIG } from '../config.js';
import { ScriptDB } from './script_db.js';
import { buildScriptGenPrompt, buildRefinePrompt, buildAnalyzePrompt, buildVideoPrompt } from '../prompts.js';
import { retryWithBackoff, shouldRetryImageGenError } from '../utils/retry_utils.js';
import { scriptCache } from '../utils/cache_utils.js';
import { compressImage, getImageSize, imageLazyLoader } from '../utils/image_utils.js';
import { progressManager, BatchProgressManager } from '../utils/progress_utils.js?v=2';
import { performanceMonitor } from '../utils/performance_utils.js';
import { ScriptGenView } from './script_gen_view.js';

export class ScriptGeneratorManager {
    constructor() {
        this.category = Object.keys(SCRIPT_CATEGORIES)[0];
        this.subCategory = SCRIPT_CATEGORIES[this.category][0];
        this.platform = "通用";
        this.narrative = "默认";
        this.duration = "30s";
        this.generatedScript = "";
        this.currentScriptId = null;
        this.isFavorite = false;
        this.referenceImageBase64 = null;
        this.isGenerating = false;

        this.view = new ScriptGenView();

        // Optimization 8: Undo/Redo Stack
        this.historyStack = [];
        this.redoStack = [];
        this.maxStackSize = 30;
    }

    init(containerId) {
        this.view.init(containerId);
        this.bindElements();
        this.updateSubCategories();
        this.loadHistory();
    }

    // injectStyles removed - CSS moved to script_

    bindElements() {
        // 先移除现有的事件监听器，避免重复绑定
        const categoryEl = document.getElementById('sg-category');
        const subcategoryEl = document.getElementById('sg-subcategory');
        const generateBtn = document.getElementById('sg-generate-btn');
        const stopBtn = document.getElementById('sg-stop-btn');
        const newBtn = document.getElementById('sg-new-btn');
        const copyBtn = document.getElementById('sg-copy-btn');
        const saveTxtBtn = document.getElementById('sg-save-txt-btn');
        const magicFillBtn = document.getElementById('sg-magic-fill-btn');
        const exportPdfBtn = document.getElementById('sg-export-pdf-btn');

        // 克隆元素以移除所有事件监听器
        const categoryNew = categoryEl.cloneNode(true);
        categoryEl.parentNode.replaceChild(categoryNew, categoryEl);
        const subcategoryNew = subcategoryEl.cloneNode(true);
        subcategoryEl.parentNode.replaceChild(subcategoryNew, subcategoryEl);
        const generateNew = generateBtn.cloneNode(true);
        generateBtn.parentNode.replaceChild(generateNew, generateBtn);
        const stopNew = stopBtn.cloneNode(true);
        stopBtn.parentNode.replaceChild(stopNew, stopBtn);
        const newNew = newBtn.cloneNode(true);
        newBtn.parentNode.replaceChild(newNew, newBtn);
        const copyNew = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(copyNew, copyBtn);
        const saveTxtNew = saveTxtBtn.cloneNode(true);
        saveTxtBtn.parentNode.replaceChild(saveTxtNew, saveTxtBtn);

        // Magic Fill
        if (magicFillBtn) {
            const magicFillNew = magicFillBtn.cloneNode(true);
            magicFillBtn.parentNode.replaceChild(magicFillNew, magicFillBtn);
            magicFillNew.addEventListener('click', () => this.magicFill());
        }

        // Export PDF
        if (exportPdfBtn) {
            const exportPdfNew = exportPdfBtn.cloneNode(true);
            exportPdfBtn.parentNode.replaceChild(exportPdfNew, exportPdfBtn);
            exportPdfNew.addEventListener('click', () => this.exportToPDF());
        }

        // 重新绑定事件监听器
        categoryNew.addEventListener('change', (e) => {
            this.category = e.target.value;
            this.updateSubCategories();
        });

        subcategoryNew.addEventListener('change', (e) => {
            this.subCategory = e.target.value;
        });

        generateNew.addEventListener('click', () => {
            setTimeout(() => this.generateScript(), 0);
        });
        stopNew.addEventListener('click', () => this.stopGeneration());

        newNew.addEventListener('click', () => {
            this.resetForm();
            this.currentScriptId = null; // Ensure new ID
        });

        copyNew.addEventListener('click', () => {
            if (!this.generatedScript) return;
            Utils.copyToClipboard(this.generatedScript);
            UI.showSuccess('脚本已复制');
        });

        saveTxtNew.addEventListener('click', () => {
            if (!this.generatedScript) return;
            Utils.downloadText(this.generatedScript, `script_${Date.now()}.md`);
        });

        this.bindExportButtons();

        document.getElementById('sg-fav-btn').addEventListener('click', async () => {
            if (!this.currentScriptId) return;
            try {
                const res = await ScriptDB.toggleFavorite(this.currentScriptId);
                this.isFavorite = res.is_favorite;
                this.updateFavIcon();
                this.loadHistory(); // Refresh list
            } catch (e) {
                UI.showError('收藏失败');
            }
        });

        // Tabs Logic
        document.querySelectorAll('.sg-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sg-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.sg-tab-content').forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Refine
        document.getElementById('sg-refine-btn').addEventListener('click', () => this.refineScript());

        // Analyze
        document.getElementById('sg-analyze-btn').addEventListener('click', () => this.analyzeScript());

        // Optimize (One-click)
        document.getElementById('sg-optimize-btn').addEventListener('click', () => this.optimizeScriptFromAnalysis());

        // Visualize
        document.getElementById('sg-visualize-btn').addEventListener('click', () => this.visualizeScript());

        // Optimization 8: Undo/Redo Bindings
        document.getElementById('sg-undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('sg-redo-btn').addEventListener('click', () => this.redo());

        // Optimization 7: Visualization Retry Binding (Delegation)
        const visOutput = document.getElementById('sg-visualize-output');
        if (visOutput) {
            visOutput.addEventListener('click', (e) => {
                const retryBtn = e.target.closest('.sg-retry-vis-btn');
                if (retryBtn) {
                    const prompt = retryBtn.dataset.prompt;
                    const itemContainer = retryBtn.closest('.sg-vis-item');
                    this.retrySingleVisualization(prompt, itemContainer);
                }
            });
        }

        // Sliders live update
        document.getElementById('sg-scene-count').addEventListener('input', (e) => {
            document.getElementById('sg-scene-val').textContent = e.target.value;
        });
        document.getElementById('sg-creativity').addEventListener('input', (e) => {
            document.getElementById('sg-creativity-val').textContent = e.target.value;
        });

        // Image Upload Logic
        const fileInput = document.getElementById('sg-ref-image');
        const uploadBtn = document.getElementById('sg-upload-btn');
        const removeBtn = document.getElementById('sg-remove-img');

        if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());

        if (fileInput) fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                UI.showError('图片大小不能超过 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    // 压缩图片
                    UI.showProgress('正在压缩图片...');
                    const compressedBase64 = await compressImage(ev.target.result, 0.8, 1024, 1024);

                    this.referenceImageBase64 = compressedBase64.split(',')[1]; // Remove data:image/...;base64, prefix
                    this.view.showImagePreview(compressedBase64);

                    const originalSize = getImageSize(ev.target.result);
                    const compressedSize = getImageSize(compressedBase64);

                    UI.showSuccess(`图片上传成功！已压缩 ${originalSize}KB → ${compressedSize}KB`);
                } catch (error) {
                    console.error('图片压缩失败:', error);
                    // 如果压缩失败，使用原图
                    this.referenceImageBase64 = ev.target.result.split(',')[1];
                    this.view.showImagePreview(ev.target.result);
                    UI.showSuccess('图片上传成功');
                } finally {
                    UI.hideProgress();
                }
            };
            reader.readAsDataURL(file);
        });

        if (removeBtn) removeBtn.addEventListener('click', () => {
            this.referenceImageBase64 = null;
            this.view.hideImagePreview();
        });

        // 监听输出区域的编辑事件 (Optimization 2)
        const outputEl = document.getElementById('sg-output');
        if (outputEl) {
            outputEl.addEventListener('input', (e) => {
                if (e.target.classList.contains('sg-editable-td')) {
                    this.syncTableToScript();
                }
            });

            // Handle button clicks in output area (Optimization 5 & 6)
            outputEl.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                if (btn.id === 'sg-add-row-btn') {
                    this.handleAddRow();
                } else if (btn.classList.contains('sg-row-regen-btn')) {
                    this.handleRegenRow(btn.closest('tr'));
                } else if (btn.classList.contains('sg-row-del-btn')) {
                    this.handleDeleteRow(btn.closest('tr'));
                }
            });
        }
    }

    syncTableToScript() {
        const outputEl = document.getElementById('sg-output');
        if (!outputEl) return;

        const tables = outputEl.querySelectorAll('table');
        if (tables.length === 0) return;

        // 获取当前脚本中非表格部分和表格部分的结构
        // 这是一个简化的同步逻辑：假设脚本中只有一个表格，或者我们只同步第一个表格
        // 更好的办法是解析整个 HTML 回 Markdown

        let fullMarkdown = "";

        // 遍历输出区域的所有子元素，将其转化回 Markdown
        Array.from(outputEl.children).forEach(child => {
            if (child.tagName === 'TABLE') {
                fullMarkdown += "\n" + this.htmlTableToMarkdown(child) + "\n";
            } else if (child.tagName.startsWith('H')) {
                const level = child.tagName[1];
                fullMarkdown += "\n" + "#".repeat(level) + " " + child.innerText + "\n";
            } else if (child.tagName === 'P') {
                fullMarkdown += "\n" + child.innerText + "\n";
            } else if (child.tagName === 'UL' || child.tagName === 'OL') {
                Array.from(child.children).forEach(li => {
                    fullMarkdown += "- " + li.innerText + "\n";
                });
            } else {
                fullMarkdown += "\n" + child.innerText + "\n";
            }
        });

        this.generatedScript = fullMarkdown.trim();
        this.pushToHistory();

        // 如果有 ID，自动排队更新数据库 (防抖处理)
        if (this.currentScriptId) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(async () => {
                try {
                    await ScriptDB.updateScript(this.currentScriptId, { content: this.generatedScript });
                } catch (e) {
                    console.error("Auto-sync failed", e);
                }
            }, 2000);
        }
    }

    htmlTableToMarkdown(table) {
        let markdown = "";
        const rows = Array.from(table.rows);
        const isScriptTable = table.querySelector('.sg-table-actions-cell') !== null || table.querySelector('.sg-table-actions') !== null;

        rows.forEach((row, i) => {
            let cells = Array.from(row.cells);

            // Optimization 6: Skip the actions column if it exists
            if (isScriptTable) {
                cells = cells.slice(0, -1);
            }

            const cellText = cells.map(c => c.innerText.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()).join(' | ');
            markdown += `| ${cellText} |\n`;

            if (i === 0) {
                // Add separator row
                const separator = cells.map(() => '---').join(' | ');
                markdown += `| ${separator} |\n`;
            }
        });

        return markdown;
    }

    handleAddRow() {
        const table = document.querySelector('#sg-output table');
        if (!table) return;
        const tbody = table.querySelector('tbody') || table;
        const lastRow = tbody.rows[tbody.rows.length - 1];
        const newRow = lastRow.cloneNode(true);

        // Clear content
        Array.from(newRow.cells).forEach((cell, idx) => {
            if (cell.classList.contains('sg-editable-td')) {
                if (idx === 0) {
                    // Auto-increment scene number
                    const lastNum = parseInt(lastRow.cells[0].innerText) || 0;
                    cell.innerText = lastNum + 1;
                } else {
                    cell.innerText = "";
                }
            }
        });

        tbody.appendChild(newRow);
        this.syncTableToScript();
    }

    handleDeleteRow(row) {
        if (confirm('确定要删除这一行吗？')) {
            row.remove();
            this.syncTableToScript();
        }
    }

    async handleRegenRow(row) {
        if (this.isGenerating) return;

        const cells = Array.from(row.cells);
        const originalContent = cells.map(c => c.innerText).join(' | ');

        UI.showProgress('AI 正在重修镜头...');
        btn = row.querySelector('.sg-row-regen-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const prompt = `你是一位剧本医生。请重写下面这一行脚本镜头，使其更具冲击力和视觉感。保持原有的表格列格式。
当前行内容：${originalContent}
背景要求：${document.getElementById('sg-theme').value}
输出格式：仅输出一行 Markdown 表格内容，例如：| 1 | 特写 | 2s | 眼神犀利 | ... |`;

            const res = await API.callQwenAPI(prompt);
            const content = res.choices ? res.choices[0].message.content : (res.output ? res.output.text : res);

            // Clean markdown syntax if AI returned full table
            const rowMatch = content.match(/\|[\s\S]*?\|/);
            if (rowMatch) {
                const newData = rowMatch[0].split('|').map(s => s.trim()).filter(s => s !== "");
                // Fill back to cells (skip last column)
                newData.forEach((val, idx) => {
                    if (cells[idx] && cells[idx].classList.contains('sg-editable-td')) {
                        cells[idx].innerText = val;
                    }
                });
                this.syncTableToScript();
                UI.showSuccess('镜头已重修');
            } else {
                throw new Error("格式解析失败");
            }
        } catch (e) {
            UI.showError('重修失败: ' + e.message);
        } finally {
            UI.hideProgress();
            if (btn) btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }
    }

    bindExportButtons() {
        document.getElementById('sg-export-docx-btn').addEventListener('click', async () => {
            if (!this.generatedScript) return;
            try {
                UI.showProgress('正在导出 Word...');
                const apiBase = CONFIG.API_BASE_URL || '';
                const res = await fetch(`${apiBase}/api/export/docx`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: this.generatedScript })
                });

                if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `script_${Date.now()}.docx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    UI.showSuccess('导出成功');
                } else {
                    throw new Error('Export failed');
                }
            } catch (e) {
                UI.showError('导出失败: ' + e.message);
            } finally {
                UI.hideProgress();
            }
        });

        document.getElementById('sg-export-xlsx-btn').addEventListener('click', async () => {
            if (!this.generatedScript) return;
            try {
                UI.showProgress('正在导出 Excel...');
                const apiBase = CONFIG.API_BASE_URL || '';
                const res = await fetch(`${apiBase}/api/export/xlsx`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: this.generatedScript })
                });

                if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `script_${Date.now()}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    UI.showSuccess('导出成功');
                } else {
                    throw new Error('Export failed');
                }
            } catch (e) {
                UI.showError('导出失败: ' + e.message);
            } finally {
                UI.hideProgress();
            }
        });
    }

    async generateScript() {
        console.log('generateScript called，调用栈：', new Error().stack);

        if (this.isGenerating) {
            console.log('generateScript 已在运行中，忽略本次调用');
            return;
        }

        this.isGenerating = true;

        const formValues = this.view.getFormValues();
        const theme = formValues.theme.trim();

        if (!theme) {
            UI.showError('请输入视频主题');
            this.isGenerating = false;
            return;
        }

        // Construct Params
        const platformStyle = PLATFORM_STYLES[formValues.platform] || '';
        const params = {
            category: this.category,
            subCategory: this.subCategory,
            platform: `${formValues.platform} (${platformStyle})`,
            ...formValues,
            hasImage: !!this.referenceImageBase64
        };

        // Brand Info construction (if getFormValues returned separate fields)
        params.brandInfo = [
            formValues.brandName ? `品牌名：${formValues.brandName}` : '',
            formValues.brandSlogan ? `Slogan：${formValues.brandSlogan}` : '',
            formValues.brandPoints ? `核心卖点：${formValues.brandPoints}` : ''
        ].filter(Boolean).join('\n');

        // 创建脚本生成进度条
        const scriptProgress = progressManager.createProgressBar('script-gen', '脚本生成', 3);
        scriptProgress.start();

        // 记录脚本生成开始时间
        const scriptStartTime = Date.now();

        UI.showProgress('AI 正在疯狂创作脚本...');

        // UI toggle
        const genBtn = document.getElementById('sg-generate-btn');
        const stopBtn = document.getElementById('sg-stop-btn');
        if (genBtn) genBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'block';

        this.abortController = new AbortController();

        try {
            // 检查缓存
            scriptProgress.update(1, '检查缓存...');
            const cachedScript = scriptCache.getCachedScript(params);
            if (cachedScript) {
                console.log('使用缓存的脚本生成结果');
                this.generatedScript = cachedScript;
                this.lastParams = params;
                this.view.renderOutput(cachedScript);

                // 自动保存
                const saveRes = await ScriptDB.saveScript({
                    type: params.category,
                    platform: params.platform,
                    theme: params.theme,
                    content: cachedScript,
                    metadata: params
                });
                this.currentScriptId = saveRes.id;
                this.isFavorite = false;
                this.view.updateFavIcon(false);
                this.loadHistory();

                scriptProgress.complete();
                UI.showSuccess('脚本生成成功！(来自缓存)');
                return;
            }

            scriptProgress.update(2, '构建提示词...');

            // 检查提示词缓存
            const cachedPrompt = scriptCache.getCachedPrompt(params);
            let prompt;

            if (cachedPrompt) {
                prompt = cachedPrompt;
                console.log('使用缓存的提示词');
            } else {
                // Build Prompt
                prompt = buildScriptGenPrompt(params);
                // 缓存提示词
                scriptCache.cachePrompt(params, prompt);
            }

            scriptProgress.update(3, '调用AI API...');
            // Call API
            const apiStartTime = Date.now();
            const content = await API.callQwenAPI(prompt, this.referenceImageBase64, null, this.abortController.signal); // Pass image if exists

            this.generatedScript = content;
            this.lastParams = params; // Store params for metadata
            this.view.renderOutput(content);

            // 缓存结果
            scriptCache.cacheScript(params, content);

            // Auto save
            const saveRes = await ScriptDB.saveScript({
                type: params.category,
                platform: params.platform,
                theme: params.theme,
                content: content,
                metadata: params
            });
            this.currentScriptId = saveRes.id;
            this.isFavorite = false;
            this.view.updateFavIcon(false);

            // 使用setTimeout延迟调用，避免在调用栈中直接触发事件
            setTimeout(() => {
                this.loadHistory();
            }, 0);

            scriptProgress.complete();

            // 延迟显示成功消息，避免立即触发其他事件
            setTimeout(() => {
                UI.showSuccess('脚本生成成功！');
            }, 100);

        } catch (e) {
            console.error('generateScript 错误：', e);
            if (e.message === '用户取消操作') {
                UI.showInfo('已停止生成');
                scriptProgress.fail('用户取消');
            } else {
                console.error(e);
                UI.showError('生成失败: ' + e.message);
                scriptProgress.fail(e.message);
            }
        } finally {
            console.log('generateScript finally 块执行');
            UI.hideProgress();
            const genBtn = document.getElementById('sg-generate-btn');
            const stopBtn = document.getElementById('sg-stop-btn');
            if (genBtn) genBtn.style.display = 'block';
            if (stopBtn) stopBtn.style.display = 'none';
            this.abortController = null;
            this.isGenerating = false; // 重置生成状态
            console.log('generateScript 状态重置完成');
        }
    }

    stopGeneration() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    updateSubCategories() {
        this.view.updateSubCategories(SCRIPT_CATEGORIES[this.category]);
        this.subCategory = SCRIPT_CATEGORIES[this.category][0];
    }

    resetForm() {
        this.generatedScript = "";
        this.currentScriptId = null;
        this.isFavorite = false;

        this.view.renderOutput('');
        this.view.renderAnalysis('点击上方按钮开始分析...');
        this.view.renderVisualization([]);

        const themeEl = document.getElementById('sg-theme');
        if (themeEl) themeEl.value = "";

        this.view.updateFavIcon(false);
    }

    updateFavIcon() {
        this.view.updateFavIcon(this.isFavorite);
    }

    async loadHistory() {
        const listEl = document.getElementById('sg-history-list');
        if (listEl) listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">加载中...</div>';

        const history = await ScriptDB.getHistory();
        this.view.renderHistory(
            history,
            this.currentScriptId,
            (id, el) => this.deleteHistoryItem(id, el),
            (item) => this.loadScriptFromHistory(item)
        );
    }

    loadScriptFromHistory(item) {
        this.currentScriptId = item.id;
        this.generatedScript = item.content;
        this.isFavorite = item.is_favorite;
        this.lastParams = item.metadata || {};

        this.view.renderOutput(this.generatedScript);
        this.view.updateFavIcon(this.isFavorite);
        this.view.setFormValues(this.lastParams);

        if (this.lastParams.analysis_report) {
            this.view.renderAnalysis(this.lastParams.analysis_report);
        } else {
            this.view.renderAnalysis("点击上方按钮开始分析...");
        }

        if (this.lastParams.visualization_data) {
            this.view.renderVisualization(this.lastParams.visualization_data);
        } else {
            this.view.renderVisualization([]);
        }
    }

    async refineScript() {
        // Keeping DOM access for refine input as it's specific to this view
        const instruction = document.getElementById('sg-refine-input').value;

        if (!instruction) {
            UI.showError('请输入修改建议');
            return;
        }

        if (!this.generatedScript) {
            UI.showError('请先生成脚本');
            return;
        }

        const refineProgress = progressManager.createProgressBar('script-refine', '脚本润色', 2);
        refineProgress.start();

        UI.showProgress('AI 正在润色脚本...');

        try {
            refineProgress.update(1, '构建润色提示词...');
            const prompt = buildRefinePrompt(this.generatedScript, instruction);

            refineProgress.update(2, '调用AI API...');
            const apiStartTime = Date.now();
            const content = await API.callQwenAPI(prompt);
            const apiDuration = Date.now() - apiStartTime;

            performanceMonitor.recordAPICall('script_refinement', apiDuration, true);

            this.generatedScript = content;
            this.view.renderOutput(content);

            // Update DB
            if (this.currentScriptId) {
                await ScriptDB.saveScript({
                    id: this.currentScriptId,
                    content: content,
                    theme: document.getElementById('sg-theme').value,
                    type: this.category,
                    platform: document.getElementById('sg-platform').value,
                    metadata: this.lastParams || {}
                });
            }

            refineProgress.complete();
            UI.showSuccess('脚本润色完成！');
            document.getElementById('sg-refine-input').value = '';

            // Switch back to preview tab
            const previewTab = document.querySelector('.sg-tab[data-tab="preview"]');
            if (previewTab) previewTab.click();

        } catch (e) {
            console.error(e);
            UI.showError('润色失败: ' + e.message);
            refineProgress.fail(e.message);

            performanceMonitor.recordAPICall('script_refinement', apiDuration, false, e);
        } finally {
            UI.hideProgress();
        }
    }

    async analyzeScript() {
        if (!this.generatedScript) {
            UI.showError('请先生成脚本');
            return;
        }

        const analyzeBtn = document.getElementById('sg-analyze-btn');
        const originalText = analyzeBtn.innerHTML;
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 分析中...';

        const analyzeProgress = progressManager.createProgressBar('script-analyze', '脚本分析', 2);
        analyzeProgress.start();

        UI.showProgress('AI 正在深度分析脚本...');

        try {
            analyzeProgress.update(1, '检查缓存...');
            const cachedAnalysis = scriptCache.getCachedAnalysis(this.generatedScript);
            if (cachedAnalysis) {
                console.log('使用缓存的分析结果');
                this.view.renderAnalysis(cachedAnalysis);

                if (this.currentScriptId) {
                    this.lastParams = this.lastParams || {};
                    this.lastParams.analysis_report = cachedAnalysis;
                    await ScriptDB.updateScript(this.currentScriptId, { metadata: this.lastParams });
                }

                analyzeProgress.complete();
                UI.showSuccess('分析报告已生成！(来自缓存)');
                return;
            }

            analyzeProgress.update(2, '调用AI API...');
            const prompt = buildAnalyzePrompt(this.generatedScript);
            const apiStartTime = Date.now();
            // Force qwen-max for analysis for best results
            const content = await API.callQwenAPI(prompt, null, null, null, "qwen-max");
            const apiDuration = Date.now() - apiStartTime;

            performanceMonitor.recordAPICall('script_analysis', apiDuration, true);

            this.view.renderAnalysis(content);
            scriptCache.cacheAnalysis(this.generatedScript, content);

            if (this.currentScriptId) {
                this.lastParams = this.lastParams || {};
                this.lastParams.analysis_report = content;
                await ScriptDB.updateScript(this.currentScriptId, { metadata: this.lastParams });
            }

            analyzeProgress.complete();
            UI.showSuccess('分析报告已生成');

        } catch (e) {
            console.error(e);
            UI.showError('分析失败: ' + e.message);
            this.view.renderAnalysis("分析失败，请重试。");
            analyzeProgress.fail(e.message);
            performanceMonitor.recordAPICall('script_analysis', 0, false, e);
        } finally {
            UI.hideProgress();
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = originalText;
        }
    }

    async optimizeScriptFromAnalysis() {
        // Need to check content of analysis div
        const analysisEl = document.getElementById('sg-analysis-output');
        if (!analysisEl || analysisEl.innerText.includes('点击上方按钮开始分析')) {
            UI.showError('请先生成分析报告');
            return;
        }

        const analysisText = analysisEl.innerText;
        if (!this.generatedScript) {
            UI.showError('请先生成脚本');
            return;
        }

        const optimizeBtn = document.getElementById('sg-optimize-btn');
        const originalText = optimizeBtn.innerHTML;
        optimizeBtn.disabled = true;
        optimizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 优化中...';

        UI.showProgress('AI 正在根据分析报告优化脚本...');

        try {
            const instruction = `请根据以下的分析报告中的建议，对脚本进行优化和修改。保留脚本原有的Markdown格式。\n\n【分析报告参考】：\n${analysisText}`;

            const prompt = buildRefinePrompt(this.generatedScript, instruction, this.lastParams);
            const apiStartTime = Date.now();
            const result = await API.callQwenAPI(prompt);
            const apiDuration = Date.now() - apiStartTime;

            performanceMonitor.recordAPICall('script_optimization', apiDuration, true);

            let content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);

            // Clean up Markdown code blocks if present (DeepSeek/Qwen often wraps output)
            const mdMatch = content.match(/```markdown([\s\S]*?)```/i) || content.match(/```([\s\S]*?)```/i);
            if (mdMatch) {
                content = mdMatch[1].trim();
            }

            this.generatedScript = content;
            this.view.renderOutput(content);

            if (this.currentScriptId) {
                await ScriptDB.saveScript({
                    id: this.currentScriptId,
                    content: content,
                    theme: document.getElementById('sg-theme').value,
                    type: this.category,
                    platform: document.getElementById('sg-platform').value,
                    metadata: this.lastParams || {}
                });
            }

            UI.showSuccess('脚本优化完成！');
            const previewTab = document.querySelector('.sg-tab[data-tab="preview"]');
            if (previewTab) previewTab.click();

        } catch (e) {
            console.error(e);
            UI.showError('优化失败: ' + e.message);
            performanceMonitor.recordAPICall('script_optimization', 0, false, e);
        } finally {
            UI.hideProgress();
            optimizeBtn.disabled = false;
            optimizeBtn.innerHTML = originalText;
        }
    }

    async visualizeScript() {
        if (!this.generatedScript) {
            UI.showError('请先生成脚本');
            return;
        }

        UI.showProgress('正在提取关键画面...');
        this.view.renderVisualization([]); // Clear previous

        // 检查可视化缓存
        const cachedVisualization = scriptCache.getCachedVisualization(this.generatedScript);
        if (cachedVisualization) {
            console.log('使用缓存的可视化结果');
            this.view.renderVisualization(cachedVisualization);
            performanceMonitor.recordCacheHit();

            if (this.currentScriptId) {
                this.lastParams = this.lastParams || {};
                this.lastParams.visualization_data = cachedVisualization;
                await ScriptDB.updateScript(this.currentScriptId, { metadata: this.lastParams });
            }
            UI.showSuccess('可视化完成！(来自缓存)');
            return;
        }

        performanceMonitor.recordCacheMiss();

        try {
            // 1. Extract Visual Descriptions using LLM
            // Optimization 7: Style Locking logic
            const useStyleLock = document.getElementById('sg-style-lock')?.checked || false;
            let styleContext = "";
            if (useStyleLock) {
                styleContext = `。请保持视觉风格的一致性：统一的色调、构图逻辑以及人物特征。`;
            }

            const extractPrompt = `
            你是一位分镜师${styleContext}。请从以下脚本中提取 3-5 个最关键、最具视觉冲击力的画面描述。
            
            【脚本内容】：
            ${this.generatedScript}
            
            请严格按照 JSON 格式输出一个数组，不要包含 Markdown 标记：
            ["画面1的详细描述(英文, Midjourney style)", "画面2的详细描述", ...]
            
            要求：通过英文描写画面、光影、镜头。JSON Only.
            `;

            const extractStartTime = Date.now();
            const text = await API.callQwenAPI(extractPrompt);
            const extractDuration = Date.now() - extractStartTime;
            performanceMonitor.recordAPICall('extract_visual_descriptions', extractDuration, true);

            let prompts = [];
            try {
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                const jsonStr = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
                prompts = JSON.parse(jsonStr);
            } catch (e) {
                console.warn("JSON Parse failed", e);
                prompts = ["Cinematic shot of the main character", "Close up of the product", "Wide shot of the environment"];
            }

            if (!Array.isArray(prompts)) prompts = [];
            if (prompts.length === 0) throw new Error("无法提取画面描述");

            // 2. Generate Images (Controlled Concurrency)
            UI.showProgress(`正在生成 ${prompts.length} 张分镜图...`);

            const container = document.getElementById('sg-visualize-output');
            const visualData = [];

            const processImage = async (promptText, index) => {
                // Create placeholder
                const imgContainer = document.createElement('div');
                imgContainer.className = 'sg-vis-item';
                imgContainer.style.position = 'relative';
                imgContainer.innerHTML = `<div class="loading-spinner"></div><p style="font-size:12px;color:#666;margin-top:5px;">正在绘制镜头 ${index + 1}...</p>`;
                container.appendChild(imgContainer);

                try {
                    const imageStartTime = Date.now();

                    // Simple fetch logic for image generation
                    const apiBase = CONFIG.API_BASE_URL || '';
                    const response = await fetch(`${apiBase}/api/proxy/image`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: promptText,
                            model: "flux-merge",
                            size: "1024*1024"
                        })
                    });

                    if (!response.ok) throw new Error(`Image Gen Failed: ${response.status}`);

                    const data = await response.json();
                    const imgUrl = data.url;

                    if (!imgUrl) throw new Error("No URL returned");

                    const imageDuration = Date.now() - imageStartTime;
                    performanceMonitor.recordAPICall('image_generation', imageDuration, true);

                    // Update UI
                    imgContainer.innerHTML = `
                        <img src="${imgUrl}" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                        <div style="margin-top:5px; font-size:12px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${promptText}</div>
                    `;

                    visualData.push({ url: imgUrl, prompt: promptText });

                } catch (e) {
                    console.error("Image Gen Error", e);
                    imgContainer.innerHTML = `
                        <div style="color:#ff4757; font-size:12px; padding:10px; border:1px dashed #ff4757; border-radius:4px; text-align:center;">
                            <i class="fas fa-exclamation-triangle"></i> 生成失败<br>
                            <button class="sg-retry-vis-btn btn btn-secondary btn-small" style="margin-top:5px;" data-prompt="${promptText.replace(/"/g, '&quot;')}">🔄 重试</button>
                        </div>
                    `;
                    performanceMonitor.recordAPICall('image_generation', 0, false, e);
                }
            };

            // Parallel generation
            await Promise.all(prompts.map((p, i) => processImage(p, i)));

            // Cache & Save
            if (visualData.length > 0) {
                scriptCache.cacheVisualization(this.generatedScript, visualData);
                if (this.currentScriptId) {
                    this.lastParams = this.lastParams || {};
                    this.lastParams.visualization_data = visualData;
                    await ScriptDB.updateScript(this.currentScriptId, { metadata: this.lastParams });
                }
            }

            UI.showSuccess('分镜图生成完毕！');

        } catch (e) {
            console.error(e);
            UI.showError('可视化失败: ' + e.message);
        } finally {
            UI.hideProgress();
        }
    }













    /**
     * 删除历史记录项
     */
    async deleteHistoryItem(id, element) {
        try {
            UI.showProgress('正在删除...');
            const success = await ScriptDB.deleteScript(id);

            if (success) {
                // 移除DOM元素
                element.style.transition = 'opacity 0.3s, transform 0.3s';
                element.style.opacity = '0';
                element.style.transform = 'translateX(-100%)';

                setTimeout(() => {
                    element.remove();

                    // 检查是否还有历史记录
                    const remainingItems = document.querySelectorAll('.sg-history-item');
                    if (remainingItems.length === 0) {
                        document.getElementById('sg-history-list').innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无历史</div>';
                    }

                    // 如果删除的是当前加载的脚本，清空当前状态
                    if (this.currentScriptId === id) {
                        this.resetForm();
                    }
                }, 300);

                UI.showSuccess('删除成功');
            } else {
                UI.showError('删除失败');
            }
        } catch (e) {
            console.error('删除历史记录失败:', e);
            UI.showError('删除失败: ' + e.message);
        } finally {
            UI.hideProgress();
        }
    }

    async magicFill() {
        if (this.isGenerating) return;

        UI.showProgress('AI 正在构思参数...');
        try {
            // Get current incomplete params or just category
            const formVals = this.view.getFormValues();

            const prompt = `作为一个专业的短视频导演，请为"${this.category} - ${this.subCategory}"类型的视频构思一套完整的脚本参数。
当前用户已填主题：${formVals.theme || "未定"}。
请以JSON格式返回，包含以下字段：
theme (如果未定则生成), audience, duration, mood, narrative, sceneCount, budget, creativity, extra,
visualStyle, pacing, viralHook, cta,
brandName, brandSlogan, brandPoints.
JSON output only.`;

            const content = await API.callQwenAPI(prompt);
            const jsonMatch = content.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                // Construct brandInfo string for setFormValues if needed, or if view handles it separated
                // View expects independent fields.

                // However, script_gen_view.js setFormValues uses specific IDs.
                // We should pass data as is, view map keys to IDs.
                // View map: theme -> sg-theme, etc.
                // brandName -> sg-brand-name

                this.view.setFormValues(data);
                UI.showSuccess('参数已自动填充');
            } else {
                throw new Error("无法解析AI返回的数据");
            }
        } catch (e) {
            console.error(e);
            UI.showError('Magic Fill 失败: ' + e.message);
        } finally {
            UI.hideProgress();
        }
    }

    async exportToPDF() {
        if (!this.generatedScript) { UI.showError('请先生成脚本'); return; }

        UI.showProgress('正在生成 PDF...');
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) throw new Error("jsPDF library not loaded");

            const doc = new jsPDF();

            doc.setFontSize(16);
            // Chinese support in jsPDF is tricky without fonts.
            // Assuming user has included a font or we use standard font which might not support Chinese perfectly.
            // But for now we just use standard.
            doc.text(document.getElementById('sg-theme').value || 'Script', 10, 10);

            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(this.generatedScript, 180);
            doc.text(splitText, 10, 20);

            doc.save(`script_${Date.now()}.pdf`);
            UI.showSuccess('PDF 导出成功');
        } catch (e) {
            console.error(e);
            UI.showError('PDF 导出失败: ' + e.message);
        } finally {
            UI.hideProgress();
        }
    }

    async retrySingleVisualization(promptText, container) {
        try {
            container.innerHTML = `<div class="loading-spinner"></div><p style="font-size:11px;color:#666;margin-top:5px;">正在重试...</p>`;
            const apiBase = CONFIG.API_BASE_URL || '';
            const response = await fetch(`${apiBase}/api/proxy/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptText,
                    model: "flux-merge",
                    size: "1024*1024"
                })
            });

            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            const imgUrl = data.url;
            if (!imgUrl) throw new Error("No URL");

            container.innerHTML = `
                <img src="${imgUrl}" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <div style="margin-top:5px; font-size:12px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${promptText}</div>
            `;
        } catch (e) {
            container.innerHTML = `
                <div style="color:#ff4757; font-size:12px; padding:10px; border:1px dashed #ff4757; border-radius:4px; text-align:center;">
                    <i class="fas fa-exclamation-triangle"></i> 重试失败<br>
                    <button class="sg-retry-vis-btn btn btn-secondary btn-small" style="margin-top:5px;" data-prompt="${promptText.replace(/"/g, '&quot;')}">🔄 再试一次</button>
                </div>
            `;
        }
    }

    pushToHistory() {
        if (!this.generatedScript) return;
        if (this.historyStack.length > 0 && this.historyStack[this.historyStack.length - 1] === this.generatedScript) return;

        this.historyStack.push(this.generatedScript);
        if (this.historyStack.length > this.maxStackSize) this.historyStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (this.historyStack.length <= 1) return;
        const current = this.historyStack.pop();
        this.redoStack.push(current);
        const previous = this.historyStack[this.historyStack.length - 1];
        this.generatedScript = previous;
        this.view.renderOutput(this.generatedScript);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const next = this.redoStack.pop();
        this.historyStack.push(next);
        this.generatedScript = next;
        this.view.renderOutput(this.generatedScript);
    }
}