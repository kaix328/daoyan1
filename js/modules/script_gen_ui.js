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
            const result = await API.callQwenAPI(prompt, this.referenceImageBase64, null, this.abortController.signal); // Pass image if exists

            // Adjust based on actual API return structure
            const content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);

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
            const result = await API.callQwenAPI(prompt);
            const apiDuration = Date.now() - apiStartTime;

            performanceMonitor.recordAPICall('script_refinement', apiDuration, true);

            const content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);

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
            const result = await API.callQwenAPI(prompt);
            const apiDuration = Date.now() - apiStartTime;

            performanceMonitor.recordAPICall('script_analysis', apiDuration, true);

            const content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);

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

    optimizeScriptFromAnalysis() {
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

            // Reuse refine logic but manually call API since we can't easily reuse refineScript without input element manipulation
            // Actually, we can just set the input and call refineScript!
            // But refineScript also calls API.
            // Let's implement directly for more control or reuse?
            // Reusing effectively reduces code duplication.

            // However, refineScript reads from DOM.
            // Let's set DOM and trigger?
            // document.getElementById('sg-refine-input').value = instruction;
            // this.refineScript();

            // But refineScript expects user interaction potentially or just works.
            // Let's copy logic to avoid issues with refineScript's UI feedback loop (like "Switch back to preview tab").
            // Actually optimizeScriptFromAnalysis DOES switch back too.

            // I'll stick to direct implementation here to match previous behavior but cleaner.

            (async () => {
                const prompt = buildRefinePrompt(this.generatedScript, instruction);
                const apiStartTime = Date.now();
                const result = await API.callQwenAPI(prompt);
                const apiDuration = Date.now() - apiStartTime;

                performanceMonitor.recordAPICall('script_optimization', apiDuration, true);

                const content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);

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

                UI.showSuccess('脚本已根据分析报告优化！');
                const previewTab = document.querySelector('.sg-tab[data-tab="preview"]');
                if (previewTab) previewTab.click();
            })();

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
            const extractPrompt = `
            你是一位分镜师。请从以下脚本中提取 3-5 个最关键、最具视觉冲击力的画面描述。
            
            【脚本内容】：
            ${this.generatedScript}
            
            请严格按照 JSON 格式输出一个数组，不要包含 Markdown 标记：
            ["画面1的详细描述(英文, Midjourney style)", "画面2的详细描述", ...]
            
            要求：通过英文描写画面、光影、镜头。JSON Only.
            `;

            const extractStartTime = Date.now();
            const extractRes = await API.callQwenAPI(extractPrompt);
            const extractDuration = Date.now() - extractStartTime;
            performanceMonitor.recordAPICall('extract_visual_descriptions', extractDuration, true);

            let prompts = [];
            try {
                const text = extractRes.choices ? extractRes.choices[0].message.content : (extractRes.output ? extractRes.output.text : extractRes);
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
                    imgContainer.innerHTML = `<div style="color:red; font-size:12px;">生成失败</div>`;
                    performanceMonitor.recordAPICall('image_generation', 0, false, e);
                }
            };

            // Sequential generation
            for (let i = 0; i < prompts.length; i++) {
                await processImage(prompts[i], i);
            }

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

            const result = await API.callQwenAPI(prompt);
            const content = result.choices ? result.choices[0].message.content : (result.output ? result.output.text : result);
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
}