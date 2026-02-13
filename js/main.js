import { CONFIG } from './config.js';
import * as Utils from './utils.js';
import * as Prompts from './prompts.js';
import * as API from './api.js';
import * as UI from './ui.js';
import * as History from './history.js';
import { ColorGradingManager } from './modules/color_grading.js';
import { exportToPDF } from './modules/exporter.js';
import { ScriptGeneratorManager } from './modules/script_gen_ui.js';

// State
let state = {
    apiKey: '', // Removed localStorage reading, rely on backend
    hasBackendKey: false, // Track if backend has key
    images: [], 
    currentAnalysisId: null,
    historyCursor: null, 
    isProjectActive: false, 
    isInitialRecord: false 
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function setSidebarVisible(visible) {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        if (visible) {
            sidebar.classList.remove('hidden');
        } else {
            sidebar.classList.add('hidden');
        }
    }
}

async function checkBackendKey() {
    try {
        const apiBase = CONFIG.API_BASE_URL || '';
        const res = await fetch(`${apiBase}/api/settings/apikey/check`);
        const data = await res.json();
        state.hasBackendKey = data.exists;
        console.log("🔑 Backend API Key Status:", data.exists ? "Configured" : "Missing");
        
        // Update Settings Input UI if exists
        if (data.exists) {
            const input = document.getElementById('apiKeyInput');
            if (input) {
                input.placeholder = "******** (已配置)";
                input.value = "";
            }
        }
    } catch(e) {
        console.error("Failed to check backend key", e);
        state.hasBackendKey = false;
    }
}

function init() {
    // Check Key first
    checkBackendKey();

    // Init Visualizers
    UI.initVisualizers();

    // Init Settings
    initSettings();

    // Bind Events
    bindEvents();
    bindTabEvents(); // Add tab handling

    // Init Color Grading
    const colorGrading = new ColorGradingManager();
    colorGrading.init('toolsContent');

    // Init Script Generator
    const scriptGen = new ScriptGeneratorManager();
    scriptGen.init('scriptContent');

    console.log("🚀 Dashboard Layout: Initializing...");
    
    // 修改：刷新页面时默认隐藏侧边栏，显示欢迎屏幕
    setSidebarVisible(false);
    
    // Init History
    History.initDB().then(async () => {
        loadHistory();
        
        // 检查是否有保存的会话
        const lastId = localStorage.getItem('lastAnalysisId');
        console.log("📦 Checking Session:", lastId ? "Found" : "None");

        if (lastId) {
            // 有会话记录，尝试恢复
            updateWorkspaceState(); // Locks initially
            await restoreLastSession();
            
            // 只有项目成功恢复后才显示侧边栏
            if (state.isProjectActive) {
                setSidebarVisible(true);
            }
        } else {
            // 没有会话记录，保持欢迎屏幕状态
            updateWorkspaceState(); // Ensure locked
        }
    });

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function bindEvents() {
    // Sidebar Toggle
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    
    // Restore state
    const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // Home Button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            // Check if tools view is active
            const toolsView = document.getElementById('toolsWorkspace');
            const scriptView = document.getElementById('scriptWorkspace');
            
            // If in Tools or Script view, return to Welcome Screen (and hide sidebar)
            if ((toolsView && toolsView.style.display === 'block') || (scriptView && scriptView.style.display === 'block')) {
                if (toolsView) toolsView.style.display = 'none';
                if (scriptView) scriptView.style.display = 'none';
                document.getElementById('welcomeScreen').style.display = 'flex';
                setSidebarVisible(false); // Hide Sidebar on Home
                return;
            }

            if (state.isProjectActive) {
                state.isProjectActive = false;
                state.currentAnalysisId = null;
                state.images = [];
                state.isInitialRecord = false;
                localStorage.removeItem('lastAnalysisId');
                
                updateWorkspaceState();
                
                // Clear active state in sidebar
                document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
                
                // Clear inputs
                UI.resetImagePreview();
                UI.clearResult();
                const nameInput = document.getElementById('projectName');
                if (nameInput) nameInput.value = '';
                
                setSidebarVisible(false); // Hide Sidebar on Home
            }
        });
    }

    // New Project Button (Sidebar)
    const newProjectBtn = document.getElementById('newProjectBtn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', async () => {
            setSidebarVisible(true); // Show sidebar when entering project
            if (state.images.length > 0) {
                const confirmed = await UI.showConfirm('确定要新建项目吗？当前未保存的内容将被清除。');
                if (!confirmed) return;
            }
            createNewProject();
        });
    }
    
    // Standalone Tools Logic
    const openToolsBtn = document.getElementById('openColorGradingBtn');
    const openScriptBtn = document.getElementById('openScriptGenBtn');
    const closeToolsBtn = document.getElementById('closeToolsBtn');
    const closeScriptBtn = document.getElementById('closeScriptBtn');
    
    // Function to handle tool opening
    const openTool = (toolId) => {
        const ws = document.getElementById('welcomeScreen');
        const wa = document.getElementById('workspaceArea');
        const tool = document.getElementById(toolId);
        
        if (ws) ws.style.display = 'none';
        if (wa) wa.style.display = 'none';
        if (tool) tool.style.display = 'block';
        
        setSidebarVisible(false); // Hide sidebar in tools
    };

    // Function to handle tool closing
    const closeTool = (toolId) => {
        const tool = document.getElementById(toolId);
        if (tool) tool.style.display = 'none';
        
        // Return to previous state
        if (state.isProjectActive) {
            const wa = document.getElementById('workspaceArea');
            if (wa) wa.style.display = 'block';
            setSidebarVisible(true); // Show sidebar if returning to project
        } else {
            const ws = document.getElementById('welcomeScreen');
            if (ws) ws.style.display = 'flex';
            setSidebarVisible(false); // Hide sidebar on home
        }
    };

    if (openToolsBtn) {
        openToolsBtn.addEventListener('click', () => openTool('toolsWorkspace'));
    }
    
    if (openScriptBtn) {
        openScriptBtn.addEventListener('click', () => openTool('scriptWorkspace'));
    }

    if (closeToolsBtn) {
        closeToolsBtn.addEventListener('click', () => closeTool('toolsWorkspace'));
    }
    
    if (closeScriptBtn) {
        closeScriptBtn.addEventListener('click', () => closeTool('scriptWorkspace'));
    }

    // Analysis
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeStoryboard);

    const sampleBtn = document.getElementById('sampleBtn');
    if (sampleBtn) sampleBtn.addEventListener('click', showSampleResult);

    // Prompts & Music
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    if (generatePromptBtn) generatePromptBtn.addEventListener('click', generateVideoPrompt);

    const analyzeMusicBtn = document.getElementById('analyzeMusicBtn');
    if (analyzeMusicBtn) analyzeMusicBtn.addEventListener('click', analyzeSoundAndMusic);

    // Copy/Save
    const copyResult = document.getElementById('copyResult');
    if (copyResult) {
        copyResult.addEventListener('click', async () => {
            try {
                const text = document.getElementById('analysisResult').innerText;
                await navigator.clipboard.writeText(text);
                UI.showSuccess('分析结果已复制到剪贴板');
            } catch (err) {
                UI.showError('复制失败');
            }
        });
    }

    const saveResult = document.getElementById('saveResult');
    if (saveResult) {
        saveResult.addEventListener('click', () => {
            const text = document.getElementById('analysisResult').innerText;
            const filename = `分镜分析_${new Date().toISOString().slice(0, 10)}.txt`;
            Utils.saveResultToFile(text, filename);
            UI.showSuccess(`结果已保存为: ${filename}`);
        });
    }

    const exportPdfBtn = document.getElementById('exportPdfBtn');

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            if (!state.images || state.images.length === 0) {
                UI.showError('没有可导出的内容');
                return;
            }
            UI.showProgress('正在生成 PDF...');
            // Pass state.images to exportToPDF
            exportToPDF(null, state.images).finally(() => {
                UI.hideProgress();
            });
        });
    }

    const clearResultBtn = document.getElementById('clearResult');
    if (clearResultBtn) clearResultBtn.addEventListener('click', UI.clearResult);

    // Modals
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) helpBtn.addEventListener('click', () => UI.showModal('helpModal'));

    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) aboutBtn.addEventListener('click', () => UI.showModal('aboutModal'));

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // History Events
    const refreshHistoryKey = document.getElementById('refreshHistoryKey');
    if (refreshHistoryKey) {
        refreshHistoryKey.addEventListener('click', loadHistory);
    }

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            if (await UI.showConfirm('确定要清空所有历史记录吗？')) {
                await History.clearAllHistory();
                loadHistory();
                UI.showSuccess('历史记录已清空');
            }
        });
    }

    const projectFilter = document.getElementById('projectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', () => {
            loadHistory();
        });
    }

    const exportProjectBtn = document.getElementById('exportProjectBtn');
    if (exportProjectBtn) {
        exportProjectBtn.addEventListener('click', async () => {
            const filter = document.getElementById('projectFilter').value;
            const history = await History.getAllHistory();

            let itemsToExport = history;
            let filename = 'all_projects_export.txt';

            if (filter) {
                if (filter === '__uncategorized__') {
                    itemsToExport = history.filter(item => !item.projectName);
                    filename = 'uncategorized_export.txt';
                } else {
                    itemsToExport = history.filter(item => item.projectName === filter);
                    filename = `${filter}_export.txt`;
                }
            }

            if (itemsToExport.length === 0) {
                UI.showError('当前列表为空，无法导出');
                return;
            }

            let content = `Project Export: ${filter || 'All Projects'}\nDate: ${new Date().toLocaleString()}\n\n`;
            content += '====================================\n\n';

            itemsToExport.forEach((item, index) => {
                content += `[Item ${index + 1}] ${item.projectName || 'Untitled'} - ${new Date(item.timestamp).toLocaleString()}\n`;
                content += `------------------------------------\n`;
                content += `${item.result}\n\n`;
                if (item.videoPrompt) {
                    content += `[Video Prompt]\n${item.videoPrompt}\n\n`;
                }
                if (item.musicAnalysis) {
                    content += `[Music Analysis]\n${item.musicAnalysis}\n\n`;
                }
                content += '====================================\n\n';
            });

            Utils.saveResultToFile(content, filename);
            UI.showSuccess(`已导出 ${itemsToExport.length} 条记录`);
        });
    }

    const renameProjectBtn = document.getElementById('renameProjectBtn');
    if (renameProjectBtn) {
        renameProjectBtn.addEventListener('click', async () => {
            const filter = document.getElementById('projectFilter').value;
            if (!filter || filter === '__uncategorized__') {
                UI.showError('请先选择一个有效项目进行重命名');
                return;
            }

            const newName = await UI.showInputModal('请输入新的项目名称:', filter);
            if (newName && newName.trim() !== '' && newName !== filter) {
                await History.renameProject(filter, newName.trim());
                loadHistory(); // Reloads and updates dropdown
                UI.showSuccess(`项目已重命名为: ${newName}`);

                // Update input if we are in that project
                const currentInputName = document.getElementById('projectName').value;
                if (currentInputName === filter) {
                    document.getElementById('projectName').value = newName;
                }
            }
        });
    }

    // Image Upload Events
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files);
        });
    }

    // Drag & Drop Support
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('highlight'), false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFileSelect(files);
        }, false);
    }
}

function handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const file = files[0];
    // Simple check for first file, but process all valid ones below
    if (Utils.isImageFile(file)) {
        processImageFiles(Array.from(files));
    } else {
        UI.showError('请选择有效的图片文件 (JPG, PNG, GIF, BMP)');
    }
}

function processImageFiles(files) {
    state.images = []; // Clear previous
    UI.toggleProgress(true, `正在处理 ${files.length} 张图片...`);

    // Clear preview area safely
    const previewContainer = document.querySelector('.preview-container');
    previewContainer.innerHTML = ''; // We will rebuild content

    let processedCount = 0;

    // If single file, we want to maintain the ID 'previewImage' for UI compatibility
    // If multiple, we just append 'img' tags.
    // However, UI.js relies on 'previewImage' for FocalSim. 
    // We will ensure at least one image has this ID or update UI.js to be smarter.
    // Let's rely on UI.js being updated to find '.preview-image' class instead of ID.

    Array.from(files).forEach((file, index) => {
        if (!Utils.isImageFile(file)) return;

        // Compress image before processing
        Utils.compressImage(file, 1920, 0.8)
            .then(base64Data => {
                state.images.push({
                    data: base64Data,
                    file: file
                });

                // Append image to preview
                const imgEl = document.createElement('img');
                imgEl.src = base64Data;
                imgEl.className = 'preview-image-item'; // Class for selection
                if (index === 0) imgEl.id = 'previewImage'; // Keep ID for first image for compat

                imgEl.style.maxWidth = files.length > 1 ? '100px' : '100%';
                imgEl.style.height = files.length > 1 ? '100px' : 'auto';
                imgEl.style.maxHeight = files.length > 1 ? '100px' : '400px';
                imgEl.style.objectFit = 'contain';
                imgEl.style.margin = '5px';

                previewContainer.appendChild(imgEl);

                processedCount++;
                if (processedCount === files.length) {
                    UI.toggleProgress(false);
                    document.getElementById('imagePreview').style.display = 'block';
                    const analyzeBtn = document.getElementById('analyzeBtn');
                    if (analyzeBtn) analyzeBtn.disabled = false;

                    UI.showSuccess(`已加载 ${state.images.length} 张图片`);
                    UI.updateResultStatus('准备就绪', 'status-pending');

                    // AUTO-SAVE IMAGES TO HISTORY
                    if (state.currentAnalysisId) {
                         History.getHistoryItemById(state.currentAnalysisId).then(item => {
                             if (item) {
                                 item.images = state.images.map(img => ({ data: img.data }));
                                 History.updateHistoryItem(item).then(() => {
                                     console.log("💾 Images auto-saved to project");
                                     loadHistory(); // Refresh thumbnail in list
                                 });
                             }
                         });
                    }
                }
            })
            .catch(err => {
                console.error('Image processing failed:', err);
                UI.showError(`图片处理失败: ${file.name}`);
                processedCount++; // Still count to unblock UI if mixed success
                if (processedCount === files.length) {
                    UI.toggleProgress(false);
                }
            });
    });
}

async function analyzeStoryboard() {
    // Check either local key (legacy) or backend key
    if (!state.apiKey && !state.hasBackendKey) {
        UI.showError('请先设置通义千问API密钥');
        // Open settings automatically
        const settingsBtn = document.getElementById('globalSettingsBtn');
        if (settingsBtn) settingsBtn.click();
        return;
    }
    if (!state.images || state.images.length === 0) {
        UI.showError('请先上传分镜图');
        return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    UI.showProgress('正在上传图片并分析...');
    analyzeBtn.disabled = true;

    try {
        let prompt;
        // Check if multiple images
        if (state.images.length > 1) {
            prompt = Prompts.buildSequencePrompt(state.images.length);
        } else {
            const type = document.getElementById('analysisType').value;
            prompt = Prompts.buildPrompt(type);
        }

        // Extract base64 strings
        const base64List = state.images.map(img => img.data.split(',')[1]);

        // Pass null/empty string for apiKey to let backend handle it
        const result = await API.callQwenAPI(prompt, base64List, state.apiKey || null);

        UI.displayResult(result, analyzeStoryboard, (details) => {
            console.log('Feedback:', details);
        });

        let projectName = document.getElementById('projectName').value.trim();

        // Auto-Naming Logic
        if (!projectName) {
            // Try to extract a title from the result (e.g., first line or generic)
            // Or just use "Scene Analysis [Time]"
            // Let's try to find a meaningful keyword from result, e.g. "Scene: ..." or just "Untitled Scene"
            // Simple approach: "Scene [Date]" is boring. 
            // Let's use the first 15 chars of result as a tentative title? No, too messy.
            // Let's stick to "Untitled Project" but maybe we can ask AI for a title in the prompt?
            // For now, let's just default to a specific format if empty, OR
            // let's try to parse the result. 
            // Often result starts with "## 场景：xxx".
            const match = result.match(/场景[：:]\s*(.*)/i) || result.match(/Scene[：:]\s*(.*)/i);
            if (match && match[1]) {
                projectName = match[1].substring(0, 20); // Use extracted scene name
            } else {
                projectName = `Project ${new Date().toLocaleDateString()}`;
            }

            // Update UI to show the auto-generated name
            document.getElementById('projectName').value = projectName;
            UI.showSuccess(`项目自动命名为: ${projectName}`);
        }

        // Save to History (Save first image as thumb)
        let historyPayload = {
            images: state.images.map(img => ({ data: img.data })), // Save only data to avoid DataCloneError with File objects
            result: result,
            type: document.getElementById('analysisType').value, // Use actual value
            projectName: projectName // Save project name
        };

        // If we are on an initial placeholder record, update it instead of creating new
        if (state.currentAnalysisId && state.isInitialRecord) {
            historyPayload.id = state.currentAnalysisId;
            state.isInitialRecord = false; // No longer initial
        }

        const historyId = await History.saveAnalysis(historyPayload);
        state.currentAnalysisId = historyId; // Update current ID (in case it changed or was new)
        localStorage.setItem('lastAnalysisId', historyId); // Persist session

        loadHistory(); // Refresh list

        UI.updateResultStatus('分析完成', 'status-success');
        UI.showSuccess('分镜图分析完成！');
    } catch (error) {
        console.error(error);
        UI.showError(`分析失败: ${error.message}`);
        UI.updateResultStatus('分析失败', 'status-error');
    } finally {
        UI.hideProgress();
        analyzeBtn.disabled = false;
    }
}


async function generateVideoPrompt() {
    const resultText = document.getElementById('analysisResult').innerText;
    
    // Check if result is just the placeholder
    if (!resultText || resultText.includes('等待分析结果') || resultText.includes('请在左侧上传')) {
        UI.showError('请先上传图片并完成分镜分析，然后再生成提示词。');
        return;
    }

    if (!state.apiKey && !state.hasBackendKey) {
        UI.showError('请先设置通义千问API密钥');
        return;
    }

    const btn = document.getElementById('generatePromptBtn');
    if (btn) btn.disabled = true;
    UI.showProgress('正在生成视频提示词...');

    try {
        const style = document.getElementById('promptStyle').value;
        const prompt = Prompts.buildVideoPrompt(resultText, style);

        // Pass null for image, we are just generating text based on previous text
        const videoPrompt = await API.callQwenAPI(prompt, null, state.apiKey || null);

        UI.displayVideoPrompt(videoPrompt);
        UI.showSuccess('视频提示词生成成功！');

        // --- Persistence Logic ---
        // 1. Update Current State (if we want to track it temporarily)
        // 2. Update History Record: We need to find the specific history item or just add it to the LAST saved item?
        // Since we don't have a "current ID", we might need to rely on saving a NEW record or updating the latest.
        // Better approach: When loading history, we set a `state.currentHistoryId`.
        // If it exists, update it. If not, we might be in a fresh analysis session.

        // For now, let's just re-save the prompt if we can.
        // Actually, simply appending to the result text might be easiest for export,
        // but for structured history, we should save it as a separate field.

        // Best User Experience: Update the currently displayed history item in DB.
        if (state.currentAnalysisId) {
            // Retrieve fresh list to find our item (or we could implement getById, but getAll is fine for now)
            const historyList = await History.getAllHistory();
            const currentItem = historyList.find(item => item.id === state.currentAnalysisId);

            if (currentItem) {
                currentItem.videoPrompt = videoPrompt;
                await History.updateHistoryItem(currentItem);
            }
        } else {
            // Fallback: If no ID (fresh legacy?), maybe save as new? 
            // Or just warn. But normally analyzeStoryboard sets the ID.
            console.warn('No active history ID found, prompt not saved to history.');
        }

    } catch (error) {
        UI.showError(`生成失败: ${error.message}`);
    } finally {
        UI.hideProgress();
        if (btn) btn.disabled = false;
    }
}



async function analyzeSoundAndMusic() {
    console.log("🎵 analyzeSoundAndMusic triggered");
    
    const resultEl = document.getElementById('analysisResult');
    if (!resultEl) {
        console.error("❌ analysisResult element not found!");
        UI.showError('系统错误：找不到分析结果元素');
        return;
    }

    const resultText = resultEl.innerText;
    console.log("📄 Analysis Text Length:", resultText ? resultText.length : 0);

    // Check if result is just the placeholder
    // Placeholder contains "等待分析结果" or "请在左侧上传"
    if (!resultText || resultText.includes('等待分析结果') || resultText.includes('请在左侧上传')) {
        console.warn("⚠️ No analysis text found (Placeholder detected)");
        UI.showError('请先上传图片并完成分镜分析，然后再生成音效。');
        return;
    }

    if (!state.apiKey && !state.hasBackendKey) {
        console.warn("⚠️ No API Key");
        UI.showError('请先设置通义千问API密钥');
        return;
    }

    const btn = document.getElementById('analyzeMusicBtn');
    UI.showProgress('正在分析音效...');
    if (btn) btn.disabled = true;

    try {
        const style = document.getElementById('musicStyle').value;
        console.log("🎹 Music Style:", style);
        
        const prompt = Prompts.buildMusicAnalysisPrompt(resultText, style);
        console.log("🚀 Sending API Request (Text-only mode)...");

        const musicAnalysis = await API.callQwenAPI(prompt, null, state.apiKey || null);
        console.log("✅ API Response Received. Length:", musicAnalysis.length);
        
        console.log("🎨 Calling UI.displayMusicAnalysis...");
        UI.displayMusicAnalysis(musicAnalysis);
        
        // Save to History
        if (state.currentAnalysisId) {
            console.log("💾 Saving music analysis to history...");
            const historyList = await History.getAllHistory();
            const currentItem = historyList.find(item => item.id === state.currentAnalysisId);

            if (currentItem) {
                currentItem.musicAnalysis = musicAnalysis;
                await History.updateHistoryItem(currentItem);
                console.log("✅ Music analysis saved!");
            } else {
                console.warn("⚠️ Current history item not found in DB");
            }
        } else {
            console.warn("⚠️ No currentAnalysisId, cannot save music analysis");
        }

        UI.showSuccess('音效分析完成！');
    } catch (error) {
        console.error("❌ Music Analysis Failed:", error);
        UI.showError(`分析失败: ${error.message}`);
    } finally {
        UI.hideProgress();
        if (btn) btn.disabled = false;
        console.log("🏁 analyzeSoundAndMusic finished");
    }
}

// Tab Switching Logic
function bindTabEvents() {
    // 1. Input Station Tabs (Left Column)
    const inputTabs = document.querySelectorAll('.tab-btn:not(.result-tab-btn)');
    inputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all input tabs
            inputTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

            // Activate current
            tab.classList.add('active');
            const targetId = `tab-${tab.dataset.tab}`;
            const target = document.getElementById(targetId);
            if (target) target.style.display = 'block';
        });
    });

    // 2. Result Tabs (Right Column)
    const resultTabs = document.querySelectorAll('.result-tab-btn');
    resultTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all result tabs
            resultTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.result-tab-content').forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });

            // Activate current
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            const target = document.getElementById(targetId);
            if (target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
        });
    });
}

function showSampleResult() {
    const sample = document.getElementById('sampleResult').innerHTML;
    UI.displayResult(sample);
    UI.updateResultStatus('示例结果', 'status-success');
    UI.showSuccess('已加载示例结果');
}

async function loadHistory() {
    const list = document.getElementById('historyList');
    const filterSelect = document.getElementById('projectFilter');
    if (!list) return;

    // Optimization: Only show spinner if list is empty to avoid flicker
    if (list.children.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center;"><i class="fas fa-spinner fa-spin"></i></div>';
    }

    // Spin the refresh icon if it exists
    const refreshBtn = document.getElementById('refreshHistoryKey');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;
    if (refreshIcon) refreshIcon.classList.add('fa-spin');

    try {
        const history = await History.getAllHistory();
        list.innerHTML = '';

        // 1. Populate Filter
        if (filterSelect) {
            // Save current selection
            const currentVal = filterSelect.value;

            const projects = new Set();
            history.forEach(item => {
                if (item.projectName) projects.add(item.projectName);
            });

            let options = '<option value="">所有项目</option>';
            projects.forEach(project => {
                options += `<option value="${project}">${project}</option>`;
            });

            // Uncategorized check
            const hasUncategorized = history.some(item => !item.projectName);
            if (hasUncategorized) {
                options += `<option value="__uncategorized__">未分类项目</option>`;
            }

            filterSelect.innerHTML = options;
            // Restore selection if valid
            if (currentVal) filterSelect.value = currentVal;

            // Bind change event (once)
            filterSelect.onchange = () => loadHistory();
        }

        // 2. Filter Items
        let filteredHistory = history;
        if (filterSelect && filterSelect.value) {
            if (filterSelect.value === '__uncategorized__') {
                filteredHistory = history.filter(item => !item.projectName);
            } else {
                filteredHistory = history.filter(item => item.projectName === filterSelect.value);
            }
        }

        if (filteredHistory.length === 0) {
            list.innerHTML = '<div style="padding:15px; color:#666; font-size:0.9rem; text-align:center;">暂无记录</div>';
            return; // Make sure to return here, but finally will still run
        }

        // 3. Render List
        filteredHistory.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            if (state.currentAnalysisId === item.id) el.classList.add('active');

            const date = new Date(item.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const displayName = item.projectName || "未命名分析";

            // Optimization: Special display for empty projects
            let statusHtml = '';
            if (item.result === '项目已创建') {
                statusHtml = '<span style="color:#aaa; font-style:italic; font-size:0.8em; margin-left:5px;">(新建 - 待上传)</span>';
            }

            // Handle thumbnail
            let thumbSrc = '';
            if (item.imageData) thumbSrc = item.imageData;
            else if (item.images && item.images.length > 0) {
                thumbSrc = item.images[0].data || item.images[0];
            }

            el.innerHTML = `
                ${thumbSrc ? `<img src="${thumbSrc}" alt="thumb">` : '<div style="width:40px;height:40px;background:#333;border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-folder-open" style="color:#555;"></i></div>'}
                <div class="history-info">
                    <div class="history-date">${displayName}${statusHtml}</div>
                    <div style="font-size:0.75rem; color:#888;">${date}</div>
                </div>
            `;

            el.addEventListener('click', () => loadHistoryItem(item));
            list.appendChild(el);
        });

    } catch (e) {
        console.error(e);
        list.innerHTML = '<div style="color:red; padding:10px;">加载失败</div>';
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

// Helper to load item
function loadHistoryItem(item) {
    // 1. Set State
    state.currentAnalysisId = item.id;
    state.isProjectActive = true;
    state.isInitialRecord = (item.result === '项目已创建');
    localStorage.setItem('lastAnalysisId', item.id);

    // 2. Restore Data
    state.images = item.images ? item.images.map(img => ({
        data: img.data || img,
        file: null
    })) : (item.imageData ? [{ data: item.imageData, file: null }] : []);

    // 3. Update Inputs
    if (item.projectName) {
        const nameInput = document.getElementById('projectName');
        if (nameInput) nameInput.value = item.projectName;
    }

    // 4. Update UI
    updateWorkspaceState();

    // 5. Restore Previews & Results
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        previewContainer.innerHTML = '';
        state.images.forEach((img, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = img.data;
            imgEl.className = 'preview-image-item';
            if (index === 0) imgEl.id = 'previewImage'; // Compat
            imgEl.style.cssText = "max-width:100px; height:100px; object-fit:cover; margin:5px; border-radius:4px;";
            previewContainer.appendChild(imgEl);
        });
        document.getElementById('imagePreview').style.display = 'block';
    }

    UI.displayResult(item.result);

    if (item.videoPrompt) {
        UI.displayVideoPrompt(item.videoPrompt);
        document.getElementById('videoPromptResult').style.display = 'block';
    } else {
        document.getElementById('videoPromptResult').style.display = 'none';
    }

    if (item.musicAnalysis) {
        UI.displayMusicAnalysis(item.musicAnalysis);
        document.getElementById('musicResult').style.display = 'block';
    } else {
        document.getElementById('musicResult').style.display = 'none';
    }

    UI.updateResultStatus('已加载', 'status-success');

    // Refresh list highlight
    loadHistory();
}

function updateWorkspaceState() {
    const welcome = document.getElementById('welcomeScreen');
    const workspace = document.getElementById('workspaceArea');
    const toolsView = document.getElementById('toolsWorkspace');
    
    // Ensure tools view is hidden when switching project states
    if (toolsView) toolsView.style.display = 'none';

    if (state.isProjectActive) {
        // Show Workspace
        if (welcome) welcome.style.display = 'none';
        if (workspace) {
            workspace.style.display = 'block';
            workspace.classList.add('slide-in'); // Add animation class if defined
        }
    } else {
        // Show Welcome
        if (welcome) welcome.style.display = 'flex';
        if (workspace) workspace.style.display = 'none';
    }
}

async function restoreLastSession() {
    const lastId = localStorage.getItem('lastAnalysisId');
    if (!lastId) return;

    try {
        const item = await History.getHistoryItemById(parseInt(lastId));
        if (item) {
            console.log('Restoring last session:', item.id);

            // Restore State
            state.images = item.images ? item.images.map(img => ({
                data: img.data || img,
                file: null
            })) : (item.imageData ? [{ data: item.imageData, file: null }] : []);

            state.currentAnalysisId = item.id;

            // Restore Preview if images exist
            if (state.images.length > 0) {
                const previewContainer = document.querySelector('.preview-container');
                previewContainer.innerHTML = '';
                state.images.forEach((img, index) => {
                    const imgEl = document.createElement('img');
                    imgEl.src = img.data;
                    imgEl.className = 'preview-image-item';
                    if (index === 0) imgEl.id = 'previewImage'; // Keep ID for first image for compat
                    imgEl.style.maxWidth = '100px';
                    imgEl.style.height = '100px';
                    imgEl.style.objectFit = 'cover';
                    imgEl.style.margin = '5px';
                    previewContainer.appendChild(imgEl);
                });
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('analyzeBtn').disabled = false;
            }

            // Display Results
            if (item.result) UI.displayResult(item.result);
            if (item.videoPrompt) UI.displayVideoPrompt(item.videoPrompt);
            if (item.musicAnalysis) UI.displayMusicAnalysis(item.musicAnalysis);


            UI.updateResultStatus('已恢复上次会话', 'status-success');

            // Unlock Workspace
            state.isProjectActive = true;
            updateWorkspaceState();
        }
    } catch (e) {
        console.error('Failed to restore session:', e);
        // If restore fails, ensure we remain locked or reset
        state.isProjectActive = false;
        updateWorkspaceState();
    }
}

async function createNewProject() {
    // Project-First Workflow: Prompt for name IMMEDIATELY
    const name = await UI.showInputModal("请输入新项目名称 (例如: 赛博朋克短片):", "");

    if (name === null) return; // User cancelled

    const projectName = name.trim() || `Project-${new Date().toLocaleDateString()}-${Date.now()}`;

    // OPTIMIZATION: If current project is an empty shell (created but not analyzed), reuse it!
    if (state.currentAnalysisId && state.isInitialRecord) {
        console.log("♻️ Reusing empty project shell:", state.currentAnalysisId);
        
        try {
            const updatedRecord = {
                id: state.currentAnalysisId,
                projectName: projectName,
                images: [],
                result: '项目已创建',
                timestamp: new Date().toISOString()
            };
            
            await History.saveAnalysis(updatedRecord);
            
            // Update UI State
            document.getElementById('projectName').value = projectName;
            UI.showSuccess(`项目已重命名为: ${projectName}`);
            
            // Refresh List
            await loadHistory();
            
            // Auto-select
            const filterSelect = document.getElementById('projectFilter');
            if (filterSelect) {
                filterSelect.value = projectName;
                filterSelect.dispatchEvent(new Event('change'));
            }
            return; // Stop here, do not create new
        } catch(e) {
            console.error("Failed to reuse project", e);
            // Fallback to create new
        }
    }

    // Reset State
    state.images = [];
    state.currentAnalysisId = null;
    localStorage.removeItem('lastAnalysisId');

    // Set Project State
    state.isProjectActive = true;

    // Reset UI Inputs
    document.getElementById('projectName').value = projectName;
    document.getElementById('projectContext').value = '';
    document.getElementById('imageInput').value = '';
    UI.resetImagePreview();
    UI.clearResult();

    // Reset Specific Result Sections
    const videoResult = document.getElementById('videoPromptResult');
    if (videoResult) videoResult.style.display = 'none';
    const musicResult = document.getElementById('musicResult');
    if (musicResult) musicResult.style.display = 'none';

    // Unlock Workspace
    updateWorkspaceState();

    // Save initial project record to ensure it appears in the list
    try {
        const initialRecord = {
            projectName: projectName,
            images: [],
            result: '项目已创建', // Initial marker
            timestamp: new Date().toISOString()
        };
        const id = await History.saveAnalysis(initialRecord);
         state.currentAnalysisId = id;
         state.isInitialRecord = true;
         localStorage.setItem('lastAnalysisId', id);
        
        // Refresh sidebar list and filter
        await loadHistory();
        
        // Auto-select the new project in filter
        const filterSelect = document.getElementById('projectFilter');
        if (filterSelect) {
            filterSelect.value = projectName;
            // Trigger change to filter list to just this project
            filterSelect.dispatchEvent(new Event('change'));
        }
    } catch (e) {
        console.error("Failed to save initial project state", e);
    }

    UI.showSuccess(`已创建新项目: ${projectName}`);
}

// Settings Modal Logic
function initSettings() {
    const settingsBtn = document.getElementById('globalSettingsBtn'); // Changed ID
    if (!settingsBtn) return;

    let modal = document.getElementById('settingsModal');

    // Create Modal if not exists
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-cog"></i> 系统设置</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label>DeepSeek / DashScope API Key:</label>
                        <input type="password" id="apiKeyInput" placeholder="sk-..." style="width: 100%; padding: 8px; margin-top: 5px;">
                        <p class="hint" style="font-size: 0.8rem; color: #666; margin-top: 5px;">Key 将安全存储在本地数据库中。</p>
                    </div>
                    <button id="saveSettingsBtn" class="btn btn-primary" style="margin-top: 15px;">保存设置</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Bind Close (ensure only bound once or use onclick)
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
    
    // Bind Save
    const saveBtn = modal.querySelector('#saveSettingsBtn');
    if (saveBtn) {
        // Use onclick to avoid multiple listeners if init called multiple times
        saveBtn.onclick = async () => {
            const key = document.getElementById('apiKeyInput').value.trim();
            if (key) {
                try {
                    const apiBase = CONFIG.API_BASE_URL || '';
                    const res = await fetch(`${apiBase}/api/settings/apikey`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ api_key: key })
                    });
                    if (res.ok) {
                        UI.showSuccess('API Key 已保存');
                        modal.style.display = 'none';
                        // Clear local state key to force backend usage (optional, but good practice)
                        state.apiKey = ''; 
                    } else {
                        throw new Error('Save failed');
                    }
                } catch (e) {
                    UI.showError('保存失败: ' + e.message);
                }
            } else {
                UI.showError('请输入有效的 API Key');
            }
        };
    }

    settingsBtn.addEventListener('click', async () => {
        modal.style.display = 'block';
        // Check if key exists (don't show actual key for security, just placeholder)
        try {
            const apiBase = CONFIG.API_BASE_URL || '';
            const res = await fetch(`${apiBase}/api/settings/apikey/check`);
            const data = await res.json();
            if (data.exists) {
                const input = document.getElementById('apiKeyInput');
                if (input) {
                    input.placeholder = "******** (已配置)";
                    input.value = ""; // Clear for security
                }
            }
        } catch(e) {
            console.error("Failed to check key status", e);
        }
    });
}
