export const GRADING_PRESETS = [
    {
        id: 'blockbuster',
        name: '商业大片 (Teal & Orange)',
        description: '经典的青橙色调分离，高对比度，肤色突出。',
        colors: ['#004747', '#FF8C00', '#0F0F0F'],
        temp: '5600K',
        tint: 'Cyan/Orange Split',
        pigments: ['Deep Teal', 'Sunset Orange', 'Rich Black'],
        promptParts: 'color grading: teal and orange split toning, high contrast S-curve, pushed saturation in highlights, crushed blacks, cinematic teal shadows, warm skin tones, blockbuster look',
        promptPartsCN: '调色：青橙色调分离，S型高对比度，高光饱和度推增，压暗黑色，电影感青色阴影，暖调肤色，商业大片视觉'
    },
    {
        id: 'cyberpunk',
        name: '赛博朋克 (Neon Noir)',
        description: '高饱和度霓虹，深邃黑位，具有像差辉光。',
        colors: ['#D600FF', '#00E5FF', '#050505'],
        temp: '8000K (Cool)',
        tint: '-20 Magenta',
        pigments: ['Neon Magenta', 'Electric Cyan', 'Midnight Black'],
        promptParts: 'color grading: cyberpunk neon noir, bioluminescent lighting bloom, chromatic aberration, deep crushed blacks, high voltage colors, magenta and cyan duality, futuristic atmosphere, wet street reflections',
        promptPartsCN: '调色：赛博朋克霓虹黑色电影，生物发光辉光，色差效果，深邃死黑，高压色彩，品红与青色二元对立，未来氛围，湿润街道反射'
    },
    {
        id: 'fuji_eterna',
        name: '富士电影 (Fuji Eterna)',
        description: '柔和的影调，低对比度，极其自然的肤色表现，现代独立电影首选。',
        colors: ['#8CA8A3', '#D6C0B0', '#4A4A4A'],
        temp: '5400K (Natural)',
        tint: 'Neutral Soft',
        pigments: ['Sage Green', 'Pale Rose', 'Slate Grey'],
        promptParts: 'color grading: Fuji Eterna film stock emulation, soft cinematic contrast, desaturated greens, natural skin tones, smooth highlight roll-off, flat profile log styling, indie movie aesthetic',
        promptPartsCN: '调色：富士Eterna胶片模拟，柔和电影对比度，低饱和绿色，自然肤色，平滑高光滚落，Log灰片风格，独立电影美学'
    },
    {
        id: 'technicolor',
        name: '三色艺彩 (Technicolor)',
        description: '好莱坞黄金时代风格，极度饱和、鲜艳的三原色分离工艺。',
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        temp: '5000K (Vivid)',
        tint: '3-Strip Saturation',
        pigments: ['Dye Transfer Red', 'Emerald Green', 'Cobalt Blue'],
        promptParts: 'color grading: 3-strip Technicolor process, hyper-saturated primaries, vintage Hollywood aesthetic, dye transfer look, vivid red green and blue, lush texture, 1950s cinema',
        promptPartsCN: '调色：三色艺彩工艺，超高饱和度三原色，好莱坞黄金时代美学，染印法质感，鲜艳红绿蓝，浓郁质感，50年代电影'
    },
    {
        id: 'noir',
        name: '经典黑白 (Film Noir)',
        description: '高反差黑白，由于严重的明暗对照法。',
        colors: ['#E0E0E0', '#404040', '#000000'],
        temp: 'Monochrome',
        tint: 'Neutral',
        pigments: ['Silver Halide', 'Charcoal', 'Pure Black'],
        promptParts: 'color grading: classic film noir, monochromatic, high contrast black and white, chiaroscuro lighting, hard rim lights, deep shadows, silver screen aesthetic, grain 35mm',
        promptPartsCN: '调色：经典黑色电影，单色，高对比度黑白，明暗对照法，硬轮廓光，深邃阴影，银幕美学，35mm胶片颗粒'
    },
    {
        id: 'wes',
        name: '韦斯·安德森 (Pastel)',
        description: '低对比度，粉彩配色，对称构图，高明调。',
        colors: ['#F7CAC9', '#92A8D1', '#FFFDD0'],
        temp: '5200K (Balanced)',
        tint: '+10 Pink',
        pigments: ['Millennial Pink', 'Serenity Blue', 'Cream Yellow'],
        promptParts: 'color grading: pastel color palette, Wes Anderson aesthetic, flat lighting, low contrast, symmetrical composition, high key lighting, soft vintage colors, whimsical symmetry',
        promptPartsCN: '调色：粉彩调色板，韦斯·安德森美学，平光照明，低对比度，对称构图，高调照明，柔和复古色彩，异想天开的对称性'
    },
    {
        id: 'fincher',
        name: '大卫·芬奇 (Fincher Green)',
        description: '以黄绿色为主调，克制、精准、冷静的惊悚氛围。',
        colors: ['#8A9A5B', '#CCCC99', '#1C2520'],
        temp: '4300K (Institutional)',
        tint: '+15 Yellow/Green',
        pigments: ['Moss Green', 'Sickly Yellow', 'Deep Olive'],
        promptParts: 'color grading: David Fincher style, institutional green and yellow tint, precise lighting, cold atmosphere, analytical mood, low key lighting, high sharpness',
        promptPartsCN: '调色：大卫·芬奇风格，机构感的黄绿色调，精准布光，冷峻氛围，冷静分析情绪，低调照明，高锐度'
    },
    {
        id: 'matrix',
        name: '矩阵绿 (Digital Decay)',
        description: '以绿色为主调，病态且数字化的反乌托邦风格。',
        colors: ['#003B00', '#20C20E', '#0D0D0D'],
        temp: '4500K (Fluorescent)',
        tint: '+30 Green',
        pigments: ['Matrix Green', 'Phosphor Green', 'Digital Black'],
        promptParts: 'color grading: matrix green tint, digital decay, desaturated skin tones, shift to green gamma, dystopian atmosphere, high contrast, technological grit, 35mm film scan',
        promptPartsCN: '调色：黑客帝国绿调，数字腐朽感，低饱和度肤色，伽马偏绿，反乌托邦氛围，高对比度，科技粗糙感，35mm胶片扫描'
    },
    {
        id: 'vintage',
        name: '70年代胶片 (Kodak 2383)',
        description: '温暖复古，明显的胶片颗粒，略微褪色。',
        colors: ['#C19A6B', '#804000', '#F5E6D3'],
        temp: '3200K (Warm)',
        tint: '+5 Yellow',
        pigments: ['Sepia', 'Burnt Sienna', 'Aged Paper'],
        promptParts: 'color grading: vintage 70s aesthetics, Kodak 2383 print film emulation, heavy film grain, warm analog tones, faded shadows, halation, nostalgic mood, low contrast',
        promptPartsCN: '调色：70年代复古美学，柯达2383印片模拟，重度胶片颗粒，温暖模拟色调，褪色阴影，光晕，怀旧情绪，低对比度'
    },
    {
        id: 'bleach',
        name: '跳漂效果 (Bleach Bypass)',
        description: '极高对比度，极低饱和度，粗糙坚硬的质感。',
        colors: ['#A0A0A0', '#505050', '#101010'],
        temp: '6000K (Cold)',
        tint: '-10 Silver',
        pigments: ['Metallic Silver', 'Slate Grey', 'Gunmetal'],
        promptParts: 'color grading: bleach bypass process, desaturated colors, extremely high contrast, metallic texture, silver retention, gritty realism, harsh lighting, war movie look',
        promptPartsCN: '调色：跳漂工艺，低饱和度色彩，极高对比度，金属质感，银留存，粗糙写实主义，严酷光照，战争片视觉'
    },
    {
        id: 'giallo',
        name: '铅黄恐怖 (Giallo Horror)',
        description: '意大利恐怖片风格，极度鲜艳的红绿对比，风格化强。',
        colors: ['#8A0303', '#004225', '#000000'],
        temp: 'Mixed Tungsten/Neon',
        tint: 'Red/Green Contrast',
        pigments: ['Blood Red', 'Poison Green', 'Shadow Black'],
        promptParts: 'color grading: Giallo horror style, Argento aesthetic, vivid blood red and deep green, gel lighting, stylized colors, nightmare atmosphere, intense saturation, theatrical lighting',
        promptPartsCN: '调色：铅黄恐怖风格，阿基多美学，鲜艳血红与深绿，色片照明，风格化色彩，噩梦氛围，高饱和度，戏剧性布光'
    },
    {
        id: 'anime_sky',
        name: '新海诚蓝 (Shinkai Azure)',
        description: '高明度，极高饱和度，清澈的蓝色天空，梦幻般的云层。',
        colors: ['#00BFFF', '#FFFFFF', '#6FA4E3'],
        temp: '6500K (Daylight)',
        tint: '+10 Blue',
        pigments: ['Azure Blue', 'Cloud White', 'Lens Flare Gold'],
        promptParts: 'color grading: Makoto Shinkai style, anime background art, vibrant azure sky, towering cumulus clouds, lens flares, hyper-detailed, sparkling lighting, emotional scenery',
        promptPartsCN: '调色：新海诚风格，动画背景美术，鲜艳蔚蓝天空，积雨云，镜头光斑，超精细细节，星芒光效，情感化风景'
    },
    {
        id: 'dune',
        name: '沙丘美学 (Arrakis Spice)',
        description: '单色沙漠黄，极简主义，朦胧的大气感。',
        colors: ['#C2B280', '#8B4513', '#E6D2B5'],
        temp: '4000K (Desert)',
        tint: '+25 Gold',
        pigments: ['Desert Sand', 'Spice Melange', 'Atmospheric Haze'],
        promptParts: 'color grading: desert monochrome, Arrakis spice tones, muted beige and brown, atmospheric haze, minimal color palette, villeneuve aesthetic, dust and sand texture, imax quality',
        promptPartsCN: '调色：沙漠单色，厄拉科斯香料色调，柔和米色与棕色，大气雾霾，极简色板，维伦纽夫美学，尘沙质感，IMAX画质'
    },
    {
        id: 'day_for_night',
        name: '日拍夜 (Day for Night)',
        description: '模拟夜景，强烈的蓝色色偏，压暗的高光，复古电影感。',
        colors: ['#000080', '#191970', '#708090'],
        temp: '3800K -> Shifted Blue',
        tint: 'Heavy Blue Cast',
        pigments: ['Midnight Blue', 'Steel Blue', 'Underexposed Grey'],
        promptParts: 'color grading: day for night technique, heavy blue tint, underexposed, moonlight simulation, deep blue shadows, artificial night look, classic cinema trick',
        promptPartsCN: '调色：日拍夜技巧，重度蓝色偏色，曝光不足，月光模拟，深蓝阴影，人造夜景感，经典电影技法'
    },
    {
        id: 'lomo',
        name: 'LOMO 交叉冲印 (Cross Process)',
        description: '不自然的色彩偏移，高对比度，黄绿色高光，紫色阴影。',
        colors: ['#9ACD32', '#4B0082', '#000000'],
        temp: 'Unbalanced',
        tint: 'Green/Violet Shift',
        pigments: ['Acid Green', 'Deep Violet', 'Blocked Black'],
        promptParts: 'color grading: cross processing, lomo aesthetic, x-pro, unpredictable color shifts, green highlights, violet shadows, high contrast, vignetting, experimental film',
        promptPartsCN: '调色：交叉冲印，LOMO美学，正片负冲，不可预测色偏，绿色高光，紫色阴影，高对比度，暗角，实验电影'
    }
];

// Expanded Lighting Options
export const LIGHTING_OPTIONS = [
    { value: 'natural light, golden hour', label: '自然光 (Golden Hour)', valueCN: '自然光，黄金时刻' },
    { value: 'studio lighting, three-point setup', label: '摄影棚光 (Studio 3-Point)', valueCN: '摄影棚照明，三点布光' },
    { value: 'hard lighting, dramatic shadows', label: '硬光 (Hard Light)', valueCN: '硬光，戏剧性阴影' },
    { value: 'soft lighting, diffused', label: '柔光 (Soft Light)', valueCN: '柔光，漫反射' },
    { value: 'cinematic lighting, volumetric fog', label: '电影感 (Cinematic + Fog)', valueCN: '电影级照明，体积雾' },
    { value: 'neon lighting, practical lights', label: '霓虹光 (Neon Practical)', valueCN: '霓虹照明，实用光源' },
    { value: 'moody lighting, low key', label: '情绪光 (Low Key)', valueCN: '情绪化照明，低调' },
    { value: 'rembrandt lighting, chiaroscuro', label: '伦勃朗光 (Rembrandt)', valueCN: '伦勃朗光，明暗对照' },
    { value: 'rim lighting, backlight', label: '轮廓光 (Rim Light)', valueCN: '轮廓光，背光' },
];

export const MOOD_OPTIONS = [
    { value: 'peaceful, calm', label: '平静 (Peaceful)', valueCN: '平静，祥和' },
    { value: 'intense, dramatic', label: '激烈 (Dramatic)', valueCN: '激烈，戏剧性' },
    { value: 'melancholic, sad', label: '忧郁 (Melancholic)', valueCN: '忧郁，悲伤' },
    { value: 'joyful, vibrant', label: '欢快 (Vibrant)', valueCN: '欢快，充满活力' },
    { value: 'mysterious, suspenseful', label: '悬疑 (Mysterious)', valueCN: '神秘，悬疑' },
    { value: 'romantic, dreamy', label: '浪漫 (Romantic)', valueCN: '浪漫，梦幻' },
    { value: 'dark, gritty', label: '黑暗 (Gritty)', valueCN: '黑暗，粗糙' },
    { value: 'ethereal, angelic', label: '空灵 (Ethereal)', valueCN: '空灵，圣洁' },
    { value: 'nostalgic, retro', label: '怀旧 (Nostalgic)', valueCN: '怀旧，复古' },
];
