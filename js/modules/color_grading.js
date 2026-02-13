import { GRADING_PRESETS, LIGHTING_OPTIONS, MOOD_OPTIONS } from './grading-presets.js';
import { PAINTING_STYLES, MEDIUMS, TECHNIQUES, ARTISTS } from './painting-presets.js';
import { CAMERAS, FILMS, LENSES } from './cameras.js';
import { generateHarmony, getHueNameCN } from './color-theory.js';
import { extractPaletteFromImage } from './image-analysis.js';
import { getGradingUI } from './color_grading_ui.js';
import { exportToPDF } from './exporter.js';

export class ColorGradingManager {
    constructor() {
        // --- Grading State ---
        this.selectedPreset = GRADING_PRESETS[0];
        this.colorMode = 'preset'; // 'preset' | 'custom' | 'image'
        this.customBaseColor = '#e11d48';
        this.harmonyType = 'complementary';
        this.uploadedImage = null;
        this.analyzedPalette = [];
        this.lighting = LIGHTING_OPTIONS[4]; // Cinematic
        this.mood = MOOD_OPTIONS[6]; // Gritty/Dark
        this.camera = CAMERAS[0];
        this.film = FILMS[0];
        this.lens = LENSES[0];
        this.subject = '';
        this.seqMode = 'single'; // 'single' | 'sequence'
        this.shots = ['', ''];
        this.lang = 'en';

        // --- Painting State ---
        this.ptStyle = PAINTING_STYLES[0];
        this.ptMedium = MEDIUMS[0];
        this.ptTechnique = TECHNIQUES[0];
        this.ptArtist = ARTISTS[0];
        this.ptLighting = LIGHTING_OPTIONS[0];
        this.ptMood = MOOD_OPTIONS[0];
        this.ptSubject = '';
        this.ptLang = 'en';

        this.generatedPrompt = '';
        this.generatedSequence = [];
    }

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Inject Styles
        this.injectStyles();

        // Inject UI
        container.innerHTML = getGradingUI();

        // Bind Elements
        this.bindElements();

        // Initialize UI State
        this.renderPresets();
        this.populateDropdowns();
        this.updateUIState();
    }

    injectStyles() {
        if (document.getElementById('cg-styles')) return;
        const style = document.createElement('style');
        style.id = 'cg-styles';
        style.textContent = `
            .color-grading-wrapper { display: flex; flex-direction: column; gap: 15px; height: 100%; }
            .cg-tabs { display: flex; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
            .cg-tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 8px 15px; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; gap: 6px; transition: 0.2s; border-radius: 4px; }
            .cg-tab-btn.active { background: rgba(255, 126, 95, 0.1); color: var(--primary); font-weight: bold; }
            .cg-tab-btn:hover { color: var(--text-primary); }

            .cg-panel { display: none; flex: 1; overflow-y: auto; }
            .cg-panel.active { display: block; }

            .cg-layout { display: grid; grid-template-columns: 1fr 350px; gap: 20px; height: 100%; }
            .cg-controls { padding-right: 10px; overflow-y: auto; }
            .cg-preview { display: flex; flex-direction: column; gap: 15px; }

            .cg-section { margin-bottom: 20px; }
            .cg-section h3 { font-size: 1rem; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; border-left: 3px solid var(--primary); padding-left: 10px; }

            .cg-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .cg-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            
            .cg-field label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; }
            .cg-field select, .cg-field input { width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px; border-radius: 4px; }

            .cg-divider { border: 0; border-top: 1px solid var(--border-color); margin: 20px 0; }

            .cg-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .cg-mode-switch, .cg-seq-switch, .cg-lang-switch { display: flex; background: var(--bg-card); padding: 3px; border-radius: 4px; border: 1px solid var(--border-color); }
            .cg-mode-btn, .cg-seq-btn, .cg-lang-btn, .pt-lang-btn { background: transparent; border: none; color: var(--text-muted); padding: 4px 10px; font-size: 0.8rem; cursor: pointer; border-radius: 3px; }
            .cg-mode-btn.active, .cg-seq-btn.active, .cg-lang-btn.active, .pt-lang-btn.active { background: var(--secondary); color: white; }

            .cg-preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto; }
            .cg-preset-item { background: transparent; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; cursor: pointer; text-align: left; transition: 0.2s; display: flex; flex-direction: column; gap: 5px; }
            .cg-preset-item:hover { border-color: var(--primary); }
            .cg-preset-item.active { background: rgba(255, 126, 95, 0.1); border-color: var(--primary); }
            .cg-preset-name { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
            .cg-mini-dna { display: flex; height: 4px; border-radius: 2px; overflow: hidden; width: 100%; }
            .cg-mini-dna div { flex: 1; }

            .cg-info-box { background: var(--bg-card); padding: 10px; border-radius: 6px; margin-top: 10px; border: 1px solid var(--border-color); }
            .cg-info-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; }
            .cg-color-bar { display: flex; height: 12px; border-radius: 3px; overflow: hidden; margin-bottom: 5px; }
            .cg-color-bar div { flex: 1; }
            .cg-info-text { font-size: 0.8rem; color: var(--text-muted); }

            .cg-custom-row { display: flex; gap: 15px; align-items: flex-end; background: var(--bg-card); padding: 10px; border-radius: 6px; }
            .cg-color-input-wrapper { display: flex; align-items: center; gap: 10px; }
            .cg-color-input-wrapper input[type="color"] { width: 40px; height: 40px; padding: 0; border: none; cursor: pointer; }

            .cg-upload-zone { border: 2px dashed var(--border-color); padding: 20px; text-align: center; border-radius: 6px; cursor: pointer; transition: 0.2s; }
            .cg-upload-zone:hover { border-color: var(--primary); background: rgba(255, 126, 95, 0.05); }
            .cg-image-row { display: flex; gap: 15px; margin-top: 10px; }
            .cg-image-row img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); }
            .cg-mini-palette { display: flex; gap: 4px; margin-top: 5px; }
            .cg-mini-palette div { width: 20px; height: 20px; border-radius: 3px; }

            .cg-input { width: 100%; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; font-family: inherit; }
            
            .cg-card { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); }
            .cg-palette-bar { display: flex; height: 50px; border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
            .cg-palette-bar div { flex: 1; }
            .cg-palette-codes { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }
            .cg-palette-desc { margin-top: 10px; font-size: 0.85rem; color: var(--text-muted); font-style: italic; }

            .flex-grow { flex: 1; display: flex; flex-direction: column; }
            #cg-prompt-output, #pt-output { flex: 1; width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; padding: 10px; color: var(--text-primary); resize: none; min-height: 150px; margin-bottom: 10px; font-family: inherit; line-height: 1.5; }

            .cg-actions { display: flex; gap: 10px; }
            .btn-primary-full { width: 100%; background: var(--primary); color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
            .btn-outline-small { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
            .btn-outline-small:hover { border-color: var(--primary); color: var(--primary); }
            
            .cg-scroll-area { flex: 1; overflow-y: auto; max-height: 400px; display: flex; flex-direction: column; gap: 10px; }
            .cg-shot-item { display: flex; gap: 10px; align-items: center; margin-bottom: 5px; }
            .cg-shot-label { font-size: 0.8rem; color: var(--text-muted); min-width: 50px; }
            
            .cg-seq-result-item { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.9rem; }
            .cg-seq-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.8rem; color: var(--accent); font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    bindElements() {
        // Tab Switching
        document.querySelectorAll('.cg-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cg-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.cg-panel').forEach(p => p.classList.remove('active'));
                
                e.currentTarget.classList.add('active');
                document.getElementById(e.currentTarget.dataset.target).classList.add('active');
            });
        });

        // Grading Mode Switch
        document.querySelectorAll('.cg-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.colorMode = e.currentTarget.dataset.mode;
                this.updateUIState();
            });
        });

        // Grading Sequence Switch
        document.querySelectorAll('.cg-seq-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.seqMode = e.currentTarget.dataset.seq;
                this.updateUIState();
            });
        });

        // Language Switch
        document.querySelectorAll('.cg-lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.lang = e.currentTarget.dataset.lang;
                this.updateUIState();
            });
        });

        document.querySelectorAll('.pt-lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.ptLang = e.currentTarget.dataset.lang;
                this.updateUIState();
            });
        });

        // Inputs Binding
        const bindSelect = (id, prop, list) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('change', (e) => {
                // If list items have 'id', use that. If 'value', use that.
                if (list[0].id) {
                    this[prop] = list.find(i => i.id === e.target.value);
                } else if (list[0].value) {
                    this[prop] = list.find(i => i.value === e.target.value || i.label === e.target.value);
                } else if (list[0].name) {
                     this[prop] = list.find(i => i.name === e.target.value);
                }
                this.generateGradingPrompt();
            });
        };

        bindSelect('cg-camera', 'camera', CAMERAS);
        bindSelect('cg-film', 'film', FILMS);
        bindSelect('cg-lens', 'lens', LENSES);
        bindSelect('cg-lighting', 'lighting', LIGHTING_OPTIONS);
        bindSelect('cg-mood', 'mood', MOOD_OPTIONS);
        
        // Custom Color Inputs
        document.getElementById('cg-custom-color').addEventListener('input', (e) => {
            this.customBaseColor = e.target.value;
            document.getElementById('cg-custom-color-val').textContent = e.target.value;
            this.generateGradingPrompt();
        });
        document.getElementById('cg-harmony').addEventListener('change', (e) => {
            this.harmonyType = e.target.value;
            this.generateGradingPrompt();
        });

        // Image Upload
        document.getElementById('cg-image-upload').addEventListener('click', () => {
            document.getElementById('cg-image-input').click();
        });
        document.getElementById('cg-reupload-btn').addEventListener('click', () => {
            document.getElementById('cg-image-input').click();
        });
        document.getElementById('cg-image-input').addEventListener('change', (e) => this.handleImageUpload(e));

        // Sequencer Inputs
        document.getElementById('cg-subject').addEventListener('input', (e) => {
            this.subject = e.target.value;
            this.generateGradingPrompt(); // Auto-regen for single mode
        });

        // Painting Inputs
        bindSelect('pt-style', 'ptStyle', PAINTING_STYLES);
        bindSelect('pt-medium', 'ptMedium', MEDIUMS);
        bindSelect('pt-technique', 'ptTechnique', TECHNIQUES);
        bindSelect('pt-artist', 'ptArtist', ARTISTS);
        bindSelect('pt-lighting', 'ptLighting', LIGHTING_OPTIONS);
        bindSelect('pt-mood', 'ptMood', MOOD_OPTIONS);

        document.getElementById('pt-subject').addEventListener('input', (e) => {
            this.ptSubject = e.target.value;
        });

        document.getElementById('pt-generate-btn').addEventListener('click', () => {
            this.generatePaintingPrompt();
        });

        // Copy Buttons
        const setupCopy = (btnId, targetId) => {
            document.getElementById(btnId).addEventListener('click', () => {
                const text = document.getElementById(targetId).value || document.getElementById(targetId).innerText;
                if(text) {
                    navigator.clipboard.writeText(text);
                    const originalText = document.getElementById(btnId).innerHTML;
                    document.getElementById(btnId).innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => document.getElementById(btnId).innerHTML = originalText, 2000);
                }
            });
        };
        setupCopy('cg-copy-btn', 'cg-prompt-output');
        setupCopy('pt-copy-btn', 'pt-output');
        
        document.getElementById('cg-copy-seq-btn').addEventListener('click', () => {
             if(this.generatedSequence.length > 0) {
                 navigator.clipboard.writeText(this.generatedSequence.join('\n\n'));
                 alert('Sequence copied!');
             }
        });

        document.getElementById('cg-regen-btn').addEventListener('click', () => this.generateGradingPrompt());

        // Sequencer Actions
        document.getElementById('cg-add-shot-btn').addEventListener('click', () => {
            this.shots.push('');
            this.renderShotList();
        });
        document.getElementById('cg-generate-seq-btn').addEventListener('click', () => {
            this.generateGradingSequence();
        });
    }

    populateDropdowns() {
        const fillSelect = (id, list, displayProp, valueProp = 'id') => {
            const el = document.getElementById(id);
            if(!el) return;
            el.innerHTML = list.map(item => 
                `<option value="${item[valueProp] || item.label || item.name}">${item[displayProp] || item.label || item.name}</option>`
            ).join('');
        };

        // Grading
        fillSelect('cg-camera', CAMERAS, 'nameCN');
        fillSelect('cg-film', FILMS, 'nameCN');
        fillSelect('cg-lens', LENSES, 'nameCN');
        fillSelect('cg-lighting', LIGHTING_OPTIONS, 'label', 'label');
        fillSelect('cg-mood', MOOD_OPTIONS, 'label', 'label');

        // Painting
        fillSelect('pt-style', PAINTING_STYLES, 'name');
        fillSelect('pt-medium', MEDIUMS, 'name');
        fillSelect('pt-technique', TECHNIQUES, 'name');
        fillSelect('pt-artist', ARTISTS, 'name', 'name');
        fillSelect('pt-lighting', LIGHTING_OPTIONS, 'label', 'label');
        fillSelect('pt-mood', MOOD_OPTIONS, 'label', 'label');
    }

    renderPresets() {
        const list = document.getElementById('cg-preset-list');
        list.innerHTML = GRADING_PRESETS.map(p => `
            <div class="cg-preset-item ${this.selectedPreset.id === p.id ? 'active' : ''}" data-id="${p.id}">
                <div class="cg-preset-name">${p.name}</div>
                <div class="cg-mini-dna">
                    ${p.colors.map(c => `<div style="background:${c}"></div>`).join('')}
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.cg-preset-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedPreset = GRADING_PRESETS.find(p => p.id === item.dataset.id);
                this.renderPresets(); // Re-render for active state
                this.updateUIState(); // Update details
                this.generateGradingPrompt();
            });
        });
    }

    renderShotList() {
        const list = document.getElementById('cg-shot-list');
        list.innerHTML = this.shots.map((shot, idx) => `
            <div class="cg-shot-item">
                <span class="cg-shot-label">Shot ${idx + 1}</span>
                <input type="text" class="cg-input shot-input" data-idx="${idx}" value="${shot}" placeholder="描述镜头...">
                <button class="btn-outline-small shot-del-btn" data-idx="${idx}"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');

        list.querySelectorAll('.shot-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.shots[e.target.dataset.idx] = e.target.value;
            });
        });

        list.querySelectorAll('.shot-del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.shots.length > 1) {
                    this.shots = this.shots.filter((_, i) => i !== parseInt(e.currentTarget.dataset.idx));
                    this.renderShotList();
                }
            });
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const palette = extractPaletteFromImage(img, 5);
                    this.analyzedPalette = palette;
                    this.uploadedImage = event.target.result;
                    
                    document.getElementById('cg-uploaded-img').src = this.uploadedImage;
                    document.getElementById('cg-analyzed-palette').innerHTML = palette.map(c => `<div style="background:${c}"></div>`).join('');
                    document.getElementById('cg-image-upload').style.display = 'none';
                    document.getElementById('cg-image-preview-area').style.display = 'block';
                    
                    this.generateGradingPrompt();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    updateUIState() {
        // Mode Visibility
        document.querySelectorAll('.cg-mode-content').forEach(el => el.style.display = 'none');
        document.getElementById(`cg-mode-${this.colorMode}`).style.display = 'block';

        document.querySelectorAll('.cg-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === this.colorMode);
        });

        // Sequence Visibility
        document.querySelectorAll('.cg-seq-content').forEach(el => el.style.display = 'none');
        document.getElementById(`cg-seq-${this.seqMode}`).style.display = 'block';
        
        document.querySelectorAll('.cg-seq-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.seq === this.seqMode);
        });

        document.getElementById('cg-output-single').style.display = this.seqMode === 'single' ? 'block' : 'none';
        document.getElementById('cg-output-sequence').style.display = this.seqMode === 'sequence' ? 'block' : 'none';

        if (this.seqMode === 'sequence' && this.shots.length === 2 && this.shots[0] === '') {
             this.renderShotList();
        }

        // Lang Buttons
        document.querySelectorAll('.cg-lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === this.lang);
        });
        document.querySelectorAll('.pt-lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === this.ptLang);
        });

        // Preset Details
        if (this.colorMode === 'preset' && this.selectedPreset) {
            document.getElementById('cg-preset-info').style.display = 'block';
            document.getElementById('cg-preset-temp').textContent = `${this.selectedPreset.temp} • ${this.selectedPreset.tint}`;
            document.getElementById('cg-preset-colors').innerHTML = this.selectedPreset.colors.map(c => `<div style="background:${c}"></div>`).join('');
            document.getElementById('cg-preset-pigments').textContent = this.selectedPreset.pigments.join(', ');
        } else {
            document.getElementById('cg-preset-info').style.display = 'none';
        }

        // Final Palette Preview update
        this.updateFinalPalettePreview();

        // Trigger Generation
        this.generateGradingPrompt();
        this.generatePaintingPrompt();
    }

    updateFinalPalettePreview() {
        let colors = [];
        let desc = '';

        if (this.colorMode === 'preset') {
            colors = this.selectedPreset.colors;
            desc = this.selectedPreset.description;
        } else if (this.colorMode === 'custom') {
            const { colors: c, colorNames } = generateHarmony(this.customBaseColor, this.harmonyType);
            colors = c;
            desc = this.lang === 'en' ? 'Custom Color Theory Palette' : '自定义色彩理论色板';
        } else if (this.colorMode === 'image') {
            colors = this.analyzedPalette;
            desc = this.lang === 'en' ? 'Extracted from Reference Image' : '从参考图中提取的色板';
        }

        const bar = document.getElementById('cg-final-palette');
        const codes = document.getElementById('cg-final-codes');
        const descEl = document.getElementById('cg-final-desc');

        if (colors.length > 0) {
            bar.innerHTML = colors.map(c => `<div style="background:${c}"></div>`).join('');
            codes.innerHTML = colors.map(c => `<span>${c}</span>`).join('');
        } else {
            bar.innerHTML = '<div style="background:#000"></div>';
            codes.innerHTML = '';
        }
        descEl.textContent = desc;
    }

    // --- Logic Core ---

    getStylePart() {
        let gradingPart = '';
        let paletteHex = [];

        if (this.colorMode === 'custom') {
            const { colors, colorNames } = generateHarmony(this.customBaseColor, this.harmonyType);
            paletteHex = colors || [];
            const colorDesc = [...new Set(colorNames || [])].join(' and ');
            const HarmonyNames = { 'complementary': 'complementary', 'analogous': 'analogous', 'triadic': 'triadic', 'split': 'split-complementary' };
            const HarmonyNamesCN = { 'complementary': '互补色', 'analogous': '近似色', 'triadic': '三角色', 'split': '分裂互补色' };

            if (this.lang === 'en') {
                gradingPart = `Color Grading: ${colorDesc} dominant palette using ${HarmonyNames[this.harmonyType]} harmony, cinematic color depth, professional grade`;
            } else {
                gradingPart = `专业调色：主导色调为${colorDesc}，采用${HarmonyNamesCN[this.harmonyType]}和谐规则，电影级色彩深度`;
            }
        } else if (this.colorMode === 'image') {
            paletteHex = this.analyzedPalette || [];
            if (this.uploadedImage) {
                if (this.lang === 'en') {
                    gradingPart = `Color Grading: Custom palette extracted from visual reference, matching reference luminosity and saturation, cinematic grade`;
                } else {
                    gradingPart = `专业调色：视觉参考图提取色板，精确匹配参考图亮度与饱和度，电影级分级`;
                }
            } else {
                gradingPart = this.lang === 'en' ? 'cinematic color grading' : '电影感调色';
            }
        } else {
            gradingPart = this.lang === 'en' ? this.selectedPreset.promptParts : this.selectedPreset.promptPartsCN;
            paletteHex = this.selectedPreset.colors || [];
        }

        if (this.colorMode === 'preset' && this.selectedPreset.temp) {
            if (this.lang === 'en') {
                gradingPart += `. Physics: ${this.selectedPreset.temp}, ${this.selectedPreset.tint}. Pigments: ${this.selectedPreset.pigments.join(', ')}`;
            } else {
                gradingPart += `。物理参数：${this.selectedPreset.temp}, ${this.selectedPreset.tint}。关键色素：${this.selectedPreset.pigments.join(', ')}`;
            }
        }

        if (paletteHex.length > 0) {
            const hexString = paletteHex.join(' ');
            if (this.lang === 'en') {
                gradingPart += `, precise hex palette: ${hexString}`;
            } else {
                gradingPart += `，精准HEX色板：${hexString}`;
            }
        }
        return gradingPart;
    }

    getGearPart() {
        if (this.lang === 'en') {
            const cam = this.camera.value ? `Shot on ${this.camera.value}` : '';
            const ln = this.lens.value ? `paired with ${this.lens.value}` : '';
            const flm = this.film.value ? `, captured on ${this.film.value}` : '';
            let result = [cam, ln, flm].filter(Boolean).join(' ');
            return result ? `, ${result}` : '';
        } else {
            const cam = this.camera.value ? `由 ${this.camera.value} 拍摄` : '';
            const ln = this.lens.value ? `搭配 ${this.lens.value}` : '';
            const flm = this.film.value ? `，采用 ${this.film.value} 胶片` : '';
            let result = [cam, ln, flm].filter(Boolean).join('');
            return result ? `，${result}` : '';
        }
    }

    getDetailsPart() {
        if (this.lang === 'en') {
            return `Lighting Setup: ${this.lighting.value}. Mood: ${this.mood.value}. Technical: 8k resolution, highly detailed, photorealistic, depth of field, ray tracing global illumination`;
        } else {
            return `布光设置：${this.lighting.valueCN}。情绪氛围：${this.mood.valueCN}。技术参数：8k分辨率，超精细细节，真实感照片级渲染，景深，光线追踪全局照明`;
        }
    }

    generateGradingPrompt() {
        if (this.seqMode === 'sequence') return; // Don't auto-generate single prompt in sequence mode

        const gradingPart = this.getStylePart();
        const gear = this.getGearPart();
        const details = this.getDetailsPart();

        if (this.lang === 'en') {
            const base = this.subject ? `Cinematic Shot: ${this.subject}. ` : 'Cinematic Shot. ';
            this.generatedPrompt = `${base}${gradingPart}${gear}. ${details}`;
        } else {
            const base = this.subject ? `电影镜头：${this.subject}。` : '电影镜头。';
            this.generatedPrompt = `${base}${gradingPart}${gear}。${details}`;
        }

        document.getElementById('cg-prompt-output').value = this.generatedPrompt;
    }

    generateGradingSequence() {
        const gradingPart = this.getStylePart();
        const gear = this.getGearPart();
        const details = this.getDetailsPart();

        this.generatedSequence = this.shots.map((shotSubject, index) => {
            const subj = shotSubject.trim() || (this.lang === 'en' ? 'scene' : '场景');
            if (this.lang === 'en') {
                const base = `[Shot ${index + 1}] Cinematic shot of ${subj}, `;
                return `${base}${gradingPart}${gear}, ${details}`;
            } else {
                const base = `[镜头 ${index + 1}] 电影感镜头，主体：${subj}，`;
                return `${base}${gradingPart}${gear}，${details}`;
            }
        });

        const resContainer = document.getElementById('cg-sequence-results');
        resContainer.innerHTML = this.generatedSequence.map((seq, i) => `
            <div class="cg-seq-result-item">
                <div class="cg-seq-header">
                    <span>SHOT ${i + 1}</span>
                </div>
                <div>${seq}</div>
            </div>
        `).join('');
    }

    generatePaintingPrompt() {
        let final = '';
        if (this.ptLang === 'en') {
            const mainDesc = this.ptSubject ? `${this.ptStyle.prompt} of ${this.ptSubject}` : this.ptStyle.prompt;
            const mediumPart = this.ptMedium.id !== 'none' ? this.ptMedium.prompt : '';
            const techPart = this.ptTechnique.id !== 'none' ? this.ptTechnique.prompt : '';
            const artistPart = this.ptArtist.val ? `art by ${this.ptArtist.val}` : '';
            const lightPart = this.ptLighting.value;
            const moodPart = this.ptMood.value;
            const quality = 'masterpiece, best quality, highly detailed, 8k resolution, artstation trending';

            final = [mainDesc, mediumPart, techPart, lightPart, moodPart, artistPart, quality]
                .filter(Boolean)
                .join(', ');
        } else {
            const mainDesc = this.ptSubject ? `${this.ptStyle.promptCN}，主体：${this.ptSubject}` : this.ptStyle.promptCN;
            const mediumPart = this.ptMedium.id !== 'none' ? this.ptMedium.promptCN : '';
            const techPart = this.ptTechnique.id !== 'none' ? this.ptTechnique.promptCN : '';
            const artistPart = this.ptArtist.val ? `艺术家：${this.ptArtist.val}` : '';
            const lightPart = this.ptLighting.valueCN;
            const moodPart = this.ptMood.valueCN;
            const quality = '杰作，最高画质，超细节，8k分辨率，Artstation热榜';

            final = [mainDesc, mediumPart, techPart, lightPart, moodPart, artistPart, quality]
                .filter(Boolean)
                .join('，');
        }

        document.getElementById('pt-output').value = final;
    }
}
