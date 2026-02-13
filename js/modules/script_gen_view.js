
import { SCRIPT_CATEGORIES, PLATFORM_STYLES, NARRATIVE_MODELS, VISUAL_STYLES, PACING_MODES, VIRAL_HOOKS, CTA_TYPES, CASTING_OPTIONS, CINEMATOGRAPHY_SPECS, SOUND_DESIGN } from './script_presets.js';

export class ScriptGenView {
    constructor() {
        this.container = null;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (this.container) {
            this.container.innerHTML = this.getTemplate();
        }
    }

    getTemplate() {
        return `
            <div class="sg-layout">
                <!-- 1. History Sidebar -->
                <div class="sg-history">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border-color);">
                        <h3 style="margin:0; font-size:1rem;">📂 历史记录</h3>
                        <button id="sg-new-btn" class="btn btn-primary btn-small"><i class="fas fa-plus"></i> 新建</button>
                    </div>
                    <div id="sg-history-list"></div>
                </div>

                <!-- 2. Controls -->
                <div class="sg-controls">
                    <div style="margin-bottom: 20px;">
                        <button id="sg-magic-fill-btn" class="btn btn-secondary btn-block" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                            <i class="fas fa-wand-magic-sparkles"></i> 智能填充 (Magic Fill)
                        </button>
                    </div>

                    <div class="sg-section">
                        <h3><i class="fas fa-layer-group"></i> 类型与平台</h3>
                        <div class="sg-field">
                            <label>视频类型 (Category)</label>
                            <select id="sg-category" class="sg-select">
                                ${Object.keys(SCRIPT_CATEGORIES).map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="sg-field">
                            <label>细分领域 (Sub-Category)</label>
                            <select id="sg-subcategory" class="sg-select"></select>
                        </div>
                        <div class="sg-field">
                            <label>发布平台 (Platform)</label>
                            <select id="sg-platform" class="sg-select">
                                ${Object.keys(PLATFORM_STYLES).map(p => `<option value="${p}">${p}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="sg-section">
                        <h3><i class="fas fa-pen-fancy"></i> 核心内容</h3>
                        <div class="sg-field">
                            <label>视频主题 (Theme)</label>
                            <input type="text" id="sg-theme" class="sg-input" placeholder="例如：新款咖啡机评测">
                        </div>
                        <div class="sg-field">
                            <label>目标受众 (Audience)</label>
                            <input type="text" id="sg-audience" class="sg-input" placeholder="例如：25-35岁上班族">
                        </div>
                        <div class="sg-field">
                            <label>时长预估 (Duration)</label>
                            <select id="sg-duration" class="sg-select">
                                <option value="15s">15秒 (短视频)</option>
                                <option value="30s">30秒 (标准)</option>
                                <option value="60s">60秒 (完整)</option>
                                <option value="3min">3分钟 (长视频)</option>
                                <option value="5min">5分钟 (剧集级)</option>
                                <option value="10min">10分钟 (重磅专题)</option>
                            </select>
                        </div>
                    </div>

                    <div class="sg-section">
                        <h3><i class="fas fa-video"></i> 导演风格</h3>
                         <div class="sg-field">
                            <label>视觉风格 (Visual Style)</label>
                            <select id="sg-visual" class="sg-select">
                                ${VISUAL_STYLES.map(s => `<option value="${s.split(' ')[0]}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="sg-field">
                            <label>剪辑节奏 (Pacing)</label>
                            <select id="sg-pacing" class="sg-select">
                                ${PACING_MODES.map(s => `<option value="${s.split(' ')[0]}">${s}</option>`).join('')}
                            </select>
                        </div>
                         <div class="sg-field">
                            <label>情感基调 (Mood)</label>
                            <select id="sg-mood" class="sg-select">
                                <option value="默认">默认</option>
                                <option value="幽默搞笑">幽默搞笑</option>
                                <option value="温馨治愈">温馨治愈</option>
                                <option value="悬疑烧脑">悬疑烧脑</option>
                                <option value="热血励志">热血励志</option>
                                <option value="焦虑痛点">焦虑痛点</option>
                                <option value="赛博朋克">赛博朋克</option>
                                <option value="争议吐槽">争议吐槽</option>
                                <option value="极简ASMR">极简ASMR</option>
                            </select>
                        </div>
                    </div>

                    <div class="sg-section">
                        <h3><i class="fas fa-bullhorn"></i> 营销策略</h3>
                        <div class="sg-field">
                            <label>开篇钩子 (Viral Hook)</label>
                            <select id="sg-hook" class="sg-select">
                                ${VIRAL_HOOKS.map(s => `<option value="${s.split(' ')[0]}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="sg-field">
                            <label>转化目标 (CTA)</label>
                            <select id="sg-cta" class="sg-select">
                                ${CTA_TYPES.map(s => `<option value="${s.split(' ')[0]}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="sg-section">
                        <h3><i class="fas fa-cogs"></i> 高级参数</h3>
                        <div class="sg-field">
                            <label>叙事模型 (Narrative Model)</label>
                            <select id="sg-narrative" class="sg-select">
                                ${Object.keys(NARRATIVE_MODELS).map(m => `<option value="${m}">${m}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="sg-field">
                            <label>场景数量: <span id="sg-scene-val">3</span></label>
                            <input type="range" id="sg-scene-count" min="1" max="10" value="3" class="sg-input">
                        </div>

                        <div class="sg-field">
                            <label>预算等级 (Budget)</label>
                            <select id="sg-budget" class="sg-select">
                                <option value="低">低成本</option>
                                <option value="中" selected>中等预算</option>
                                <option value="高">高规格</option>
                            </select>
                        </div>

                        <!-- Professional Casting -->
                        <div class="sg-field-group">
                            <label><i class="fas fa-users"></i> 选角指导 (Casting)</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                                <select id="sg-cast-age" class="sg-select">
                                    <option value="" disabled selected>年龄段</option>
                                    ${CASTING_OPTIONS.age_groups.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                                <select id="sg-cast-arch" class="sg-select">
                                    <option value="" disabled selected>职业属性</option>
                                    ${CASTING_OPTIONS.archetypes.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                            </div>
                            <select id="sg-cast-style" class="sg-select">
                                <option value="" disabled selected>表演风格</option>
                                ${CASTING_OPTIONS.acting_styles.map(o => `<option value="${o}">${o}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Professional Cinematography -->
                        <div class="sg-field-group" style="margin-top:15px;">
                            <label><i class="fas fa-camera"></i> 拍摄规格 (Specs)</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <select id="sg-cine-ratio" class="sg-select">
                                    <option value="" disabled selected>画幅比例</option>
                                    ${CINEMATOGRAPHY_SPECS.aspect_ratios.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                                <select id="sg-cine-shot" class="sg-select">
                                    <option value="" disabled selected>景别偏好</option>
                                    ${CINEMATOGRAPHY_SPECS.shot_sizes.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                            </div>
                            <select id="sg-cine-light" class="sg-select" style="margin-top:10px;">
                                <option value="" disabled selected>光影基调</option>
                                ${CINEMATOGRAPHY_SPECS.lighting_keys.map(o => `<option value="${o}">${o}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Sound Design -->
                        <div class="sg-field-group" style="margin-top:15px;">
                            <label><i class="fas fa-music"></i> 音效设计 (Audio)</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <select id="sg-sound-voice" class="sg-select">
                                    <option value="" disabled selected>人声处理</option>
                                    ${SOUND_DESIGN.voice_styles.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                                <select id="sg-sound-music" class="sg-select">
                                    <option value="" disabled selected>音乐流派</option>
                                    ${SOUND_DESIGN.music_genres.map(o => `<option value="${o}">${o}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="sg-field" style="margin-top:15px;">
                            <label>创意度 (Creativity): <span id="sg-creativity-val">0.85</span></label>
                            <input type="range" id="sg-creativity" min="0.1" max="1.5" step="0.05" value="0.85" class="sg-input">
                        </div>

                        <div class="sg-field">
                            <label>品牌/产品信息 (Brand Info)</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                                <input type="text" id="sg-brand-name" class="sg-input" placeholder="品牌名 (Brand Name)">
                                <input type="text" id="sg-brand-slogan" class="sg-input" placeholder="Slogan (口号)">
                            </div>
                            <textarea id="sg-brand-points" class="sg-textarea" placeholder="核心卖点 (Key Selling Points)..."></textarea>
                        </div>
                        
                        <div class="sg-field">
                            <label><i class="fas fa-image"></i> 参考素材 (Reference Image)</label>
                            <div class="sg-file-upload">
                                <input type="file" id="sg-ref-image" accept="image/*" style="display:none;">
                                <button id="sg-upload-btn" class="btn btn-secondary btn-block">
                                    <i class="fas fa-cloud-upload-alt"></i> 上传产品图/参考图
                                </button>
                                <div id="sg-image-preview" style="margin-top:10px; display:none; text-align:center; position:relative;">
                                    <img id="sg-preview-img" style="max-width:100%; max-height:200px; border-radius:8px; border:1px solid var(--border-color);">
                                    <button id="sg-remove-img" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">&times;</button>
                                </div>
                            </div>
                            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">AI 将自动分析图片内容并融入脚本创作。</p>
                        </div>

                        <div class="sg-field">
                            <label>额外要求 (Extra)</label>
                            <textarea id="sg-extra" class="sg-textarea" placeholder="例如：特殊运镜、BGM要求..."></textarea>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button id="sg-generate-btn" class="btn btn-primary btn-block"><i class="fas fa-magic"></i> 生成分镜脚本</button>
                            <button id="sg-stop-btn" class="btn btn-danger btn-block" style="display:none; background-color: #dc3545;"><i class="fas fa-stop"></i> 停止</button>
                        </div>
                    </div>
                </div>

                <!-- 3. Preview & Tabs -->
                <div class="sg-preview">
                    <div class="sg-tabs">
                        <div class="sg-tab active" data-tab="preview">📄 脚本预览</div>
                        <div class="sg-tab" data-tab="refine">✨ 润色修改</div>
                        <div class="sg-tab" data-tab="analyze">📊 AI 分析</div>
                        <div class="sg-tab" data-tab="visualize">🎨 画面生成</div>
                    </div>

                    <!-- Tab 1: Preview -->
                    <div id="tab-preview" class="sg-tab-content active">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="margin:0;"><i class="fas fa-file-alt"></i> 脚本内容</h3>
                            <div class="sg-actions">
                                <button id="sg-undo-btn" class="btn btn-secondary btn-small" title="撤销"><i class="fas fa-undo"></i></button>
                                <button id="sg-redo-btn" class="btn btn-secondary btn-small" title="重做"><i class="fas fa-redo"></i></button>
                                <button id="sg-fav-btn" class="btn btn-secondary btn-small" title="收藏"><i class="far fa-heart"></i></button>
                                <button id="sg-copy-btn" class="btn btn-secondary btn-small"><i class="fas fa-copy"></i> 复制</button>
                                <button id="sg-export-pdf-btn" class="btn btn-secondary btn-small"><i class="fas fa-file-pdf"></i> PDF</button>
                                <button id="sg-save-txt-btn" class="btn btn-secondary btn-small"><i class="fas fa-file-alt"></i> TXT</button>
                                <button id="sg-export-docx-btn" class="btn btn-secondary btn-small"><i class="fas fa-file-word"></i> Word</button>
                                <button id="sg-export-xlsx-btn" class="btn btn-secondary btn-small"><i class="fas fa-file-excel"></i> Excel</button>
                            </div>
                        </div>
                        <div id="sg-output"></div>
                    </div>

                    <!-- Tab 2: Refine -->
                    <div id="tab-refine" class="sg-tab-content">
                        <div class="sg-section">
                            <label>修改指令</label>
                            <textarea id="sg-refine-input" class="sg-textarea" placeholder="例如：增加反转，更幽默一点..."></textarea>
                            <button id="sg-refine-btn" class="btn btn-primary btn-block" style="margin-top:10px;">✨ 确认修改</button>
                        </div>
                        <div class="sg-info-box" style="padding:15px; background:rgba(var(--primary-rgb),0.1); border-radius:4px;">
                            <i class="fas fa-info-circle"></i> 在此输入修改意见，AI 将基于当前脚本进行重写。
                        </div>
                    </div>

                    <!-- Tab 3: Analyze -->
                    <div id="tab-analyze" class="sg-tab-content">
                         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="margin:0;">深度分析报告</h3>
                            <div style="display:flex; gap:10px;">
                                <button id="sg-optimize-btn" class="btn btn-secondary btn-small" title="根据分析报告优化脚本"><i class="fas fa-magic"></i> 一键优化</button>
                                <button id="sg-analyze-btn" class="btn btn-primary btn-small">🤖 开始分析</button>
                            </div>
                        </div>
                        <div id="sg-analysis-output">点击上方按钮开始分析...</div>
                    </div>

                    <!-- Tab 4: Visualize -->
                    <div id="tab-visualize" class="sg-tab-content">
                        <div class="sg-section">
                            <h3 style="margin:0;">AI 分镜绘画</h3>
                            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">提取脚本中的关键画面，自动生成分镜草图。</p>
                            <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:var(--text-muted); margin-bottom:15px; cursor:pointer;">
                                <input type="checkbox" id="sg-style-lock" checked> 启用视觉一致性锁定 (Style Consistency)
                            </label>
                            <button id="sg-visualize-btn" class="btn btn-primary btn-block"><i class="fas fa-paint-brush"></i> 生成分镜图</button>
                        </div>
                        <div id="sg-visualize-output" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px; margin-top:20px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHistory(history, activeId, onDelete, onLoad) {
        const listEl = document.getElementById('sg-history-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        if (history.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">暂无历史</div>';
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'sg-history-item';
            if (activeId === item.id) el.classList.add('active');

            el.innerHTML = `
                <div class="history-title">${item.theme}</div>
                <div class="history-meta">
                    <span>${item.date.slice(5, 16)}</span>
                    ${item.is_favorite ? '<i class="fas fa-heart history-fav"></i>' : ''}
                    <button class="history-delete-btn" data-id="${item.id}" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            const titleEl = el.querySelector('.history-title');
            titleEl.addEventListener('click', () => onLoad(item));

            const deleteBtn = el.querySelector('.history-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(item.id, el);
                });
            }

            listEl.appendChild(el);
        });
    }

    renderOutput(content) {
        const outputEl = document.getElementById('sg-output');
        if (!outputEl) return;

        if (window.marked) {
            let html = window.marked.parse(content);

            // Optimization 2 & 6: Enhance tables to be interactive
            // 1. Add Actions column to headers
            html = html.replace(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/g, (match, cells) => {
                if (cells.includes('序号') || cells.includes('景别')) {
                    return `<thead><tr>${cells}<th class="sg-table-actions">操作</th></tr></thead>`;
                }
                return match;
            });

            // 2. Add action buttons and editable cells to body
            html = html.replace(/<tbody>\s*([\s\S]*?)\s*<\/tbody>/g, (match, rowsHTML) => {
                if (rowsHTML.includes('<td>')) {
                    const rows = rowsHTML.split(/<\/tr>\s*<tr>/);
                    const enhancedRows = rows.map(row => {
                        // Check if it's a script table row (has multiple tds)
                        if ((row.match(/<td/g) || []).length >= 3) {
                            return row.replace(/<td/g, '<td contenteditable="true" class="sg-editable-td"') +
                                `<td class="sg-table-actions-cell">
                                        <button class="sg-row-regen-btn" title="重修此镜头"><i class="fas fa-sync-alt"></i></button>
                                        <button class="sg-row-del-btn" title="删除"><i class="fas fa-trash-alt"></i></button>
                                   </td>`;
                        }
                        return row;
                    });
                    return `<tbody><tr>${enhancedRows.join('</tr><tr>')}</tr></tbody>`;
                }
                return match;
            });

            outputEl.innerHTML = html;

            // Add "Add Row" button if there's a table
            if (outputEl.querySelector('table')) {
                const addBtn = document.createElement('button');
                addBtn.id = 'sg-add-row-btn';
                addBtn.className = 'btn btn-secondary btn-small';
                addBtn.style.margin = '10px 0';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加镜头行';
                outputEl.appendChild(addBtn);
            }
        } else {
            outputEl.innerHTML = `<pre>${content}</pre>`;
        }
    }

    renderAnalysis(content) {
        const outputEl = document.getElementById('sg-analysis-output');
        if (!outputEl) return;
        if (window.marked) {
            outputEl.innerHTML = window.marked.parse(content);
        } else {
            outputEl.innerHTML = `<pre>${content}</pre>`;
        }
    }

    renderVisualization(data) {
        const container = document.getElementById('sg-visualize-output');
        if (!container) return;
        container.innerHTML = '';

        data.forEach(item => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'sg-vis-item';
            imgContainer.innerHTML = `
                <img src="${item.url}" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <div style="margin-top:5px; font-size:12px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.prompt}</div>
            `;
            container.appendChild(imgContainer);
        });
    }

    updateFavIcon(isFavorite) {
        const btn = document.getElementById('sg-fav-btn');
        if (!btn) return;
        if (isFavorite) {
            btn.innerHTML = '<i class="fas fa-heart" style="color:#ff4757;"></i>';
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    }

    updateSubCategories(categories) {
        const subSelect = document.getElementById('sg-subcategory');
        if (!subSelect) return;
        subSelect.innerHTML = categories.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    showImagePreview(src) {
        const previewDiv = document.getElementById('sg-image-preview');
        const previewImg = document.getElementById('sg-preview-img');
        const uploadBtn = document.getElementById('sg-upload-btn');

        if (previewImg) previewImg.src = src;
        if (previewDiv) previewDiv.style.display = 'block';
        if (uploadBtn) uploadBtn.style.display = 'none';
    }

    hideImagePreview() {
        const previewDiv = document.getElementById('sg-image-preview');
        const uploadBtn = document.getElementById('sg-upload-btn');
        const fileInput = document.getElementById('sg-ref-image');

        if (previewDiv) previewDiv.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'block';
        if (fileInput) fileInput.value = '';
    }

    // New helper to set form values programmatically
    setFormValues(values) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined) el.value = val;
        };

        if (values.theme) setVal('sg-theme', values.theme);
        if (values.audience) setVal('sg-audience', values.audience);
        if (values.duration) setVal('sg-duration', values.duration);
        if (values.mood) setVal('sg-mood', values.mood);
        if (values.narrative) setVal('sg-narrative', values.narrative);
        if (values.sceneCount) {
            setVal('sg-scene-count', values.sceneCount);
            const valEl = document.getElementById('sg-scene-val');
            if (valEl) valEl.textContent = values.sceneCount;
        }
        if (values.budget) setVal('sg-budget', values.budget);
        if (values.creativity) {
            setVal('sg-creativity', values.creativity);
            const valEl = document.getElementById('sg-creativity-val');
            if (valEl) valEl.textContent = values.creativity;
        }
        if (values.extra) setVal('sg-extra', values.extra);

        // Styles
        if (values.visualStyle) setVal('sg-visual', values.visualStyle);
        if (values.pacing) setVal('sg-pacing', values.pacing);
        if (values.viralHook) setVal('sg-hook', values.viralHook);
        if (values.cta) setVal('sg-cta', values.cta);

        // Pro fields
        if (values.casting) {
            setVal('sg-cast-age', values.casting.age);
            setVal('sg-cast-arch', values.casting.archetype);
            setVal('sg-cast-style', values.casting.style);
        }
        if (values.cine) {
            setVal('sg-cine-ratio', values.cine.ratio);
            setVal('sg-cine-shot', values.cine.shot);
            setVal('sg-cine-light', values.cine.light);
        }
        if (values.sound) {
            setVal('sg-sound-voice', values.sound.voice);
            setVal('sg-sound-music', values.sound.music);
        }

        // Brand Info Parsing (best effort)
        if (values.brandInfo) {
            const nameMatch = values.brandInfo.match(/品牌名：(.*?)(?:\n|$)/);
            if (nameMatch) setVal('sg-brand-name', nameMatch[1]);
            const sloganMatch = values.brandInfo.match(/Slogan：(.*?)(?:\n|$)/);
            if (sloganMatch) setVal('sg-brand-slogan', sloganMatch[1]);
            const pointsMatch = values.brandInfo.match(/核心卖点：([\s\S]*?)(?:\n|$)/);
            if (pointsMatch) setVal('sg-brand-points', pointsMatch[1]);
        }
    }

    getFormValues() {
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };

        return {
            theme: getVal('sg-theme'),
            audience: getVal('sg-audience'),
            duration: getVal('sg-duration'),
            mood: getVal('sg-mood'),
            narrative: getVal('sg-narrative'),
            sceneCount: getVal('sg-scene-count'),
            budget: getVal('sg-budget'),
            creativity: getVal('sg-creativity'),
            extra: getVal('sg-extra'),

            // Sub-objects
            brandName: getVal('sg-brand-name'),
            brandSlogan: getVal('sg-brand-slogan'),
            brandPoints: getVal('sg-brand-points'),

            visualStyle: getVal('sg-visual'),
            pacing: getVal('sg-pacing'),
            viralHook: getVal('sg-hook'),
            cta: getVal('sg-cta'),

            casting: {
                age: getVal('sg-cast-age'),
                archetype: getVal('sg-cast-arch'),
                style: getVal('sg-cast-style')
            },
            cine: {
                ratio: getVal('sg-cine-ratio'),
                shot: getVal('sg-cine-shot'),
                light: getVal('sg-cine-light')
            },
            sound: {
                voice: getVal('sg-sound-voice'),
                music: getVal('sg-sound-music')
            }
        };
    }
}
