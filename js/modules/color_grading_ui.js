export const getGradingUI = () => `
<div class="color-grading-wrapper">
    <style>
        .cg-layout { display: grid; grid-template-columns: 1fr 350px; gap: 20px; height: 100%; overflow: hidden; }
        .cg-controls { padding-right: 10px; overflow-y: auto; height: 100%; }
        .cg-preview { display: flex; flex-direction: column; gap: 15px; height: 100%; overflow-y: auto; }
    </style>
    <!-- Sub Tabs -->
    <div class="cg-tabs">
        <button class="cg-tab-btn active" data-target="grading-panel">
            <i class="fas fa-film"></i> 电影调色 (Grading)
        </button>
        <button class="cg-tab-btn" data-target="painting-panel">
            <i class="fas fa-paint-brush"></i> 艺术绘画 (Painting)
        </button>
    </div>

    <!-- Grading Panel -->
    <div id="grading-panel" class="cg-panel active">
        <div class="cg-layout">
            <!-- Left: Controls -->
            <div class="cg-controls">
                
                <!-- Section 1: Camera Gear -->
                <div class="cg-section">
                    <h3><i class="fas fa-camera"></i> 摄影参数配置</h3>
                    <div class="cg-grid-3">
                        <div class="cg-field">
                            <label>机身 (Camera)</label>
                            <select id="cg-camera"></select>
                        </div>
                        <div class="cg-field">
                            <label>胶片 (Film)</label>
                            <select id="cg-film"></select>
                        </div>
                        <div class="cg-field">
                            <label>镜头 (Lens)</label>
                            <select id="cg-lens"></select>
                        </div>
                    </div>
                </div>

                <hr class="cg-divider">

                <!-- Section 2: Grading Mode -->
                <div class="cg-section">
                    <div class="cg-header-row">
                        <h3><i class="fas fa-palette"></i> 调色风格</h3>
                        <div class="cg-mode-switch">
                            <button class="cg-mode-btn active" data-mode="preset">预设</button>
                            <button class="cg-mode-btn" data-mode="custom">自定义</button>
                            <button class="cg-mode-btn" data-mode="image">参考图</button>
                        </div>
                    </div>

                    <!-- Mode: Preset -->
                    <div id="cg-mode-preset" class="cg-mode-content active">
                        <div class="cg-preset-grid" id="cg-preset-list"></div>
                        <div id="cg-preset-info" class="cg-info-box" style="display:none;">
                            <div class="cg-info-header">
                                <span>Color DNA</span>
                                <span id="cg-preset-temp"></span>
                            </div>
                            <div class="cg-color-bar" id="cg-preset-colors"></div>
                            <div class="cg-info-text">Pigments: <span id="cg-preset-pigments"></span></div>
                        </div>
                    </div>

                    <!-- Mode: Custom -->
                    <div id="cg-mode-custom" class="cg-mode-content" style="display:none;">
                        <div class="cg-custom-row">
                            <div class="cg-field">
                                <label>主色 (Key Color)</label>
                                <div class="cg-color-input-wrapper">
                                    <input type="color" id="cg-custom-color" value="#e11d48">
                                    <span id="cg-custom-color-val">#e11d48</span>
                                </div>
                            </div>
                            <div class="cg-field">
                                <label>色彩和谐 (Harmony)</label>
                                <select id="cg-harmony">
                                    <option value="complementary">互补色 (Complementary)</option>
                                    <option value="analogous">近似色 (Analogous)</option>
                                    <option value="triadic">三角色 (Triadic)</option>
                                    <option value="split">分裂互补色 (Split-Complementary)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Mode: Image -->
                    <div id="cg-mode-image" class="cg-mode-content" style="display:none;">
                        <div class="cg-upload-zone" id="cg-image-upload">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>点击上传参考图</p>
                            <input type="file" id="cg-image-input" accept="image/*" style="display:none;">
                        </div>
                        <div id="cg-image-preview-area" style="display:none;">
                            <div class="cg-image-row">
                                <img id="cg-uploaded-img" src="" alt="Ref">
                                <div>
                                    <p>已提取色板:</p>
                                    <div class="cg-mini-palette" id="cg-analyzed-palette"></div>
                                    <button id="cg-reupload-btn" class="btn-text">重新上传</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Lighting & Mood -->
                <div class="cg-section">
                    <div class="cg-grid-2">
                        <div class="cg-field">
                            <label>光照 (Lighting)</label>
                            <select id="cg-lighting"></select>
                        </div>
                        <div class="cg-field">
                            <label>情绪 (Mood)</label>
                            <select id="cg-mood"></select>
                        </div>
                    </div>
                </div>

                <hr class="cg-divider">

                <!-- Section 4: Sequencer -->
                <div class="cg-section">
                    <div class="cg-header-row">
                        <label><i class="fas fa-layer-group"></i> 场记板 / 镜头列表</label>
                        <div class="cg-seq-switch">
                            <button class="cg-seq-btn active" data-seq="single">单镜头</button>
                            <button class="cg-seq-btn" data-seq="sequence">连贯模式</button>
                        </div>
                    </div>

                    <div id="cg-seq-single" class="cg-seq-content active">
                        <input type="text" id="cg-subject" class="cg-input" placeholder="主体：例如：雨中的侦探...">
                    </div>

                    <div id="cg-seq-sequence" class="cg-seq-content" style="display:none;">
                        <div id="cg-shot-list"></div>
                        <button id="cg-add-shot-btn" class="btn-outline-small"><i class="fas fa-plus"></i> 添加镜头</button>
                        <button id="cg-generate-seq-btn" class="btn-primary-full"><i class="fas fa-layer-group"></i> 生成场记板序列</button>
                    </div>
                </div>

            </div>

            <!-- Right: Preview & Output -->
            <div class="cg-preview">
                
                <!-- Palette Preview -->
                <div class="cg-card">
                    <h3><i class="fas fa-eye"></i> 色板预览</h3>
                    <div class="cg-palette-bar" id="cg-final-palette"></div>
                    <div class="cg-palette-codes" id="cg-final-codes"></div>
                    <p class="cg-palette-desc" id="cg-final-desc"></p>
                </div>

                <!-- Output -->
                <div class="cg-card flex-grow">
                    <div class="cg-header-row">
                        <h3>生成的提示词</h3>
                        <div class="cg-lang-switch">
                            <button class="cg-lang-btn active" data-lang="en">EN</button>
                            <button class="cg-lang-btn" data-lang="cn">中文</button>
                        </div>
                    </div>
                    
                    <div id="cg-output-single">
                        <textarea id="cg-prompt-output" readonly placeholder="提示词将显示在这里..."></textarea>
                        <div class="cg-actions">
                            <button id="cg-copy-btn" class="btn-primary"><i class="fas fa-copy"></i> 复制</button>
                            <button id="cg-regen-btn" class="btn-outline"><i class="fas fa-sync"></i></button>
                        </div>
                    </div>

                    <div id="cg-output-sequence" style="display:none;">
                        <div id="cg-sequence-results" class="cg-scroll-area"></div>
                        <div class="cg-actions">
                            <button id="cg-copy-seq-btn" class="btn-primary">复制全部</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Painting Panel -->
    <div id="painting-panel" class="cg-panel">
        <div class="cg-layout">
            <div class="cg-controls">
                <div class="cg-section">
                    <h3><i class="fas fa-paint-brush"></i> 艺术配置</h3>
                    <div class="cg-grid-2">
                        <div class="cg-field">
                            <label>艺术风格 (Style)</label>
                            <select id="pt-style"></select>
                        </div>
                        <div class="cg-field">
                            <label>艺术家 (Artist)</label>
                            <select id="pt-artist"></select>
                        </div>
                        <div class="cg-field">
                            <label>媒介 (Medium)</label>
                            <select id="pt-medium"></select>
                        </div>
                        <div class="cg-field">
                            <label>技法 (Technique)</label>
                            <select id="pt-technique"></select>
                        </div>
                    </div>
                </div>

                <hr class="cg-divider">

                <div class="cg-section">
                    <div class="cg-grid-2">
                        <div class="cg-field">
                            <label>光照 (Lighting)</label>
                            <select id="pt-lighting"></select>
                        </div>
                        <div class="cg-field">
                            <label>情绪 (Mood)</label>
                            <select id="pt-mood"></select>
                        </div>
                    </div>
                </div>

                <div class="cg-section">
                    <label>画面主体 (Subject)</label>
                    <textarea id="pt-subject" class="cg-input" rows="3" placeholder="描述你想要画什么..."></textarea>
                </div>

                <button id="pt-generate-btn" class="btn-primary-full"><i class="fas fa-magic"></i> 生成绘画提示词</button>
            </div>

            <div class="cg-preview">
                <div class="cg-card flex-grow">
                    <div class="cg-header-row">
                        <h3>生成的提示词</h3>
                        <div class="cg-lang-switch">
                            <button class="pt-lang-btn active" data-lang="en">EN</button>
                            <button class="pt-lang-btn" data-lang="cn">中文</button>
                        </div>
                    </div>
                    <textarea id="pt-output" readonly placeholder="杰作即将呈现..."></textarea>
                    <div class="cg-actions">
                        <button id="pt-copy-btn" class="btn-primary"><i class="fas fa-copy"></i> 复制</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
