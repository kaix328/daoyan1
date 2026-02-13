import { VISUAL_STYLE_DESCRIPTIONS } from './modules/script_presets.js';

export function buildPrompt(analysisType, context = '') {
    let detailLevel = '';

    switch (analysisType) {
        case 'detailed':
            detailLevel = '请提供极其详细的分析，包含具体参数、详细解释和多个备选方案。';
            break;
        case 'quick':
            detailLevel = '请提供简洁的分析，聚焦于关键参数和建议。';
            break;
        default:
            detailLevel = '请提供全面的分析，包含所有必要参数和建议。';
    }

    let contextPrompt = '';
    if (context) {
        contextPrompt = `\n## 📋 项目一致性约束 (Consistency Context)\n请注意以下项目设定，并检查分镜图是否符合这些约束：\n${context}\n`;
    }

    return `你是一位资深电影导演和摄影指导。请分析这张分镜图，提供专业级的镜头运镜方案。

${contextPrompt}

## 🔍 第一步：视觉元素识别
请先详细描述你在这张分镜图中看到的视觉元素，确保识别准确：
1. 主要人物/物体的位置、动作和表情
2. 场景环境、背景细节和空间布局
3. 光影效果、明暗对比和光源方向
4. 色彩构成、色调和视觉氛围
5. 构图特点、视觉焦点和画面平衡
6. 任何特殊的视觉元素或符号

请确认你的视觉识别是否准确。如果某些元素识别不确定，请说明。

## 🎬 第二步：导演分析（基于准确识别）
1. 场景情绪分析：
2. 叙事重点：
3. 视觉节奏建议：

## 📹 第三步：镜头运镜方案
1. 推荐运镜方式：
   - 推/拉镜头：
   - 摇/移镜头：
   - 跟拍/手持：
   - 升降/航拍：

## 🔭 第四步：摄影技术参数
1. 推荐镜头类型：
2. 建议焦段：
3. 光圈设置：
4. 快门速度：
5. ISO设置：
6. 色温/白平衡：

## 🎥 第五步：设备推荐
1. 最适合的相机型号：
2. 推荐镜头组合：
3. 辅助设备：
4. 特殊附件：

## 💡 第六步：创意建议
1. 光影设计：
2. 色彩方案：
3. 构图技巧：
4. 转场方式：

${detailLevel}

请确保：
1. 视觉识别准确后再进行分析
2. 建议专业、实用，符合电影工业标准
3. 如果某些元素识别不确定，请明确说明
4. 提供基于准确视觉识别的专业建议`;
}

export function buildSequencePrompt(count, context = '') {
    let contextPrompt = '';
    if (context) {
        contextPrompt = `\n**项目背景与一致性约束**：\n${context}\n`;
    }

    return `你是一位资深电影导演和剪辑师。我上传了 ${count} 张连续的分镜图。${contextPrompt}请分析这一组镜头的叙事流畅度和视听语言：

1. **叙事连贯性**：这组镜头讲述了什么情节？逻辑是否通顺？
2. **一致性检查**：检查人物造型、场景细节是否符合项目背景设定？是否存在穿帮或不连贯之处？
3. **蒙太奇效果**：镜头之间的衔接产生了什么意义？（例如：通过对比产生冲突，或通过相似性产生联想）
4. **视觉节奏**：景别变化（全/中/近/特）是否合理？是否有助于情绪递进？
5. **剪辑建议**：
   - 建议的转场方式（切、叠化、淡入淡出）
   - 每个镜头的建议时长
   - 声音衔接建议（J-Cut / L-Cut）

请以专业导演的口吻输出分析报告。`;
}

export function buildFocusedPrompt(context = '') {
    let contextPrompt = '';
    if (context) {
        contextPrompt = `\n结合项目背景：\n${context}\n`;
    }

    return `你是一位电影摄影指导。这是一张分镜图的局部裁剪细节。${contextPrompt}

请专注于分析这个局部的视觉细节：
1. **细节描述**：你看到了什么（人物表情、道具细节、光影质感）？
2. **情绪暗示**：这个细节传递了什么潜台词或情绪？
3. **拍摄建议**：如果这是特写镜头，建议使用什么打光方式和焦点设置？

请简明扼要地进行深度微观分析。`;
}

export function buildVideoPrompt(analysisResult, style) {
    let styleInstruction = '';
    let suffix = '';

    switch (style) {
        case 'cinematic':
            styleInstruction = '目标风格: 电影感写实风格，IMAX 级别画质，注重光影和质感。';
            suffix = ' --ar 16:9 --style raw';
            break;
        case 'anime':
            styleInstruction = '目标风格: 高质量日漫风格，新海诚画风，2D 动画渲染。';
            suffix = ' --niji 6';
            break;
        case '3d':
            styleInstruction = '目标风格: 3D 渲染，虚幻引擎 5 效果，光线追踪，高细节。';
            break;
        case 'cyberpunk':
            styleInstruction = '目标风格: 赛博朋克，霓虹黑色电影美学，未来感，高对比度。';
            break;
        default:
            styleInstruction = '目标风格: 根据分镜内容自动适配最合适的视觉风格。';
    }

    return `你是一位精通 AI 视频生成的提示词工程师（擅长可灵、即梦、Midjourney 等工具）。
你的任务是根据以下的分镜分析，生成一段**中文**视频生成提示词。

### 1. 来源分析
${analysisResult}

### 2. 目标风格
${styleInstruction}
必要后缀参数: ${suffix || '无'}
动态参数: -motion 5

### 3. 任务要求
严格从来源分析中提取视觉细节来构建提示词：
- **主体**: 描述主要人物/物体及其具体的**动作**。
- **环境**: 描述场景细节、氛围。
- **运镜**: **关键** - 必须将分析中的“运镜方式”（如推拉摇移）转化为具体的提示词。
- **光影**: 提取具体的光影类型。

### 4. 输出格式
请按以下格式输出（请使用**中文**）：

**中文提示词 (用于国内模型):**
[主体与动作], [环境与氛围], [运镜方式], [光影与色彩], [质感关键词] ${suffix ? suffix : ''}

**英文提示词 (English Prompt for Midjourney/Runway):**
[Subject & Action], [Environment & Atmosphere], [Camera Movement], [Lighting], [Texture Keywords] ${suffix ? suffix : ''} --motion 5

**负面提示词 (Negative):**
文字, 水印, 模糊, 低质量, 变形, 糟糕的解剖结构, 丑陋, 像素化

**注意:**
- 保持逻辑清晰。
- 重点描述画面中的动态和运镜。`;
}

export function buildMusicAnalysisPrompt(analysisResult, style) {
    let styleInstruction = '';

    switch (style) {
        case 'cinematic':
            styleInstruction = '推荐电影原声风格的配乐，注重情感表达和戏剧性。';
            break;
        case 'epic':
            styleInstruction = '推荐史诗大气风格的音乐，适合宏大场景和英雄主题。';
            break;
        case 'emotional':
            styleInstruction = '推荐情感抒情的音乐，注重内心情感表达。';
            break;
        case 'tense':
            styleInstruction = '推荐紧张悬疑风格的音乐，适合 suspense 场景。';
            break;
        case 'upbeat':
            styleInstruction = '推荐轻快活泼的音乐，适合欢乐和轻松场景。';
            break;
        default:
            styleInstruction = '根据场景自动推荐最适合的音乐风格。';
    }

    return `你是一位专业的音效设计师和音乐总监。基于以下导演分析，提供专业的音效和背景音乐建议，特别针对 AI 音乐生成工具（如 Suno, Udio）。:
    
${analysisResult}

${styleInstruction}

请提供以下内容的详细建议：
1. **Suno/Udio 提示词**:
   - **Style**: (Genres, Instruments, Era, BPM) - 例如: "Cinematic, Orchestral, Epic, 90bpm"
   - **Structure**: (Title, Verse, Chorus) - 如果需要歌词，请提供简单的结构建议。
2. **背景音乐详细描述**: 情绪、乐器、节奏。
3. **环境音效设计**: 需要的环境音 (Ambience) 和拟音 (Foley)。
4. **混音建议**: 如何处理人声与背景音乐的平衡。

请确保输出包含一个可以直接复制到 Suno/Udio 的 "Style Prompt"。`;
}



export function buildScriptGenPrompt(params) {
    const {
        category, subCategory, platform, theme, audience, duration,
        mood, narrative, sceneCount, budget, creativity,
        brandInfo, extra, visualStyle, pacing, viralHook, cta,
        casting, cine, sound, hasImage // Pro objects + Image flag
    } = params;

    // 1. Hook Strategy
    const hookPrompt = viralHook ? `\n- **开篇钩子策略**: ${viralHook}\n` : '';

    // Image Reference Instruction
    const imagePrompt = hasImage ? `
【参考图片分析】：
用户上传了一张参考图片（产品图/参考图）。请先**详细分析这张图片**的内容（产品特征、场景、色调、质感），并将分析结果深度融入到脚本创作中，特别是：
1. 确保脚本中的画面描述与图片中的产品/风格保持高度一致。
2. 提取图片中的视觉亮点作为脚本的核心视觉元素。
` : '';

    // 2. Pro Instructions
    const castingPrompt = casting ? `
- **选角指导**:
  - 年龄层: ${casting.age || '不限'}
  - 职业原型: ${casting.archetype || '不限'}
  - 表演风格: ${casting.style || '默认'}
` : '';

    const cinePrompt = cine ? `
- **拍摄规格**:
  - 画幅比例: ${cine.ratio || '默认'}
  - 景别偏好: ${cine.shot || '默认'}
  - 光影基调: ${cine.light || '默认'}
` : '';

    const soundPrompt = sound ? `
- **音效设计**:
  - 人声处理: ${sound.voice || '默认'}
  - 音乐流派: ${sound.music || '默认'}
` : '';

    // Expand Visual Style
    const visualStyleName = visualStyle ? visualStyle.split(' ')[0] : '默认';
    const visualStyleDesc = VISUAL_STYLE_DESCRIPTIONS[visualStyleName] || visualStyle || '默认';

    // 3. Body Structure based on Category
    let structurePrompt = '';
    if (category === "直播带货") {
        structurePrompt = `
# 2. 直播流程表 (ROS)
请使用 Markdown 表格形式，表头包含：| 时间点 | 环节 | 主播话术(关键句) | 助播/展示配合 | 关键利益点/逼单策略 |
- **环节**：如引入、痛点戳破、产品展示、价格锚点、逼单、成交。
- **主播话术**：包含欢迎语、留人话术、痛点场景描述。
- **展示配合**：近景特写、实验演示、道具配合。`;
    } else if (category === "知识/IP打造") {
        structurePrompt = `
# 2. 口播提词表 (Teleprompter Script)
请使用 Markdown 表格形式，表头包含：| 模块 | 预计时长 | 核心金句(逐字稿) | 画面/B-roll建议 | 情绪/语速 |
- **模块**：黄金开头、干货输出1、干货输出2、互动引导。
- **核心金句**：适合口播的短句，包含逻辑重音标注。
- **画面/B-roll**：配合口播展示的图片、图表或空镜。`;
    } else {
        structurePrompt = `
# 2. 详细分镜表
请使用 Markdown 表格形式，表头包含：| 序号 | 景别 | 时长 | 画面内容 | 运镜/剪辑 | 音效/台词 |
- **注意**：表格内容中严禁使用换行符，确保每一行都是有效的 Markdown 表格行，以便于 Excel 导出。
- **时长**：预估镜头时长（如 2s, 4.5s）。
  **必须执行思维链 (Chain of Thought)**：
  1. 先列出所有镜头的预估时长。
  2. 计算当前总时长。
  3. 如果总时长不等于目标时长 (${duration})，调整各个镜头的时长直到完全匹配。
  4. 最终输出的表格中，所有镜头时长之和必须严格等于 ${duration}。
- **画面内容**：包含动作、表情、道具、布光。
- **运镜/剪辑**：
  - 运镜：推、拉、摇、移、跟、升降、手持震动等。
  - 剪辑：硬切(Hard Cut)、叠化(Dissolve)、匹配剪辑(Match Cut)、淡入淡出等。
- **音效/台词**：
  - [人声]：对白、旁白 (VO)。
  - [SFX]：具体动作音效（如“脚步声”、“玻璃碎裂”）。
  - [BGM]：背景音乐情绪。`;
    }

    return `你是一位顶级广告导演和短视频编剧专家 (ScriptCraft AI)。
你的任务是根据用户的详细需求，创作一个专业级的分镜脚本。

【核心类型】：${category} - ${subCategory}
【平台风格】：${platform}
【主题】：${theme}
【目标受众】：${audience}
【情感基调】：${mood}
【叙事模型】：${narrative}
【视觉风格】：${visualStyleDesc}
【剪辑节奏】：${pacing || '默认'}
【转化目标 (CTA)】：${cta || '默认'}
${brandInfo ? `【品牌植入】：${brandInfo}` : ''}
${extra ? `【额外要求】：${extra}` : ''}

【进阶参数】：
- 场景数量：${sceneCount}
- 预算等级：${budget}
- 创意度：${creativity}
${castingPrompt}${cinePrompt}${soundPrompt}
${imagePrompt}

请严格按照 Markdown 格式输出，必须包含以下模块：

# 1. 创意概要
- **爆款标题库**：5个吸引眼球的标题
- **核心创意点**：一句话概括核心卖点或反转
- **视觉风格**：详细描述色调、光影
- **推荐BGM**：具体曲目或风格${hookPrompt}

${structurePrompt}

# 3. 拍摄与制作清单 (基于预算：${budget})
- **道具清单**：列出关键道具
- **场景需求**：列出拍摄地点
- **演员需求**：列出角色特征

# 4. AI 绘画提示词
提取前3个关键镜头，生成英文 Prompt (Midjourney格式)。

---
请开始创作。`;
}

export function buildRefinePrompt(currentScript, instruction) {
    return `你是一位专业的剧本医生 (Script Doctor)。请根据用户的指令，修改以下分镜脚本。

【修改指令】：${instruction}

【原始脚本】：
${currentScript}

请直接输出修改后的完整脚本（保持原有的 Markdown 格式），无需解释修改理由。`;
}

export function buildAnalyzePrompt(script) {
    return `你是一位资深的电影监制和市场分析师。请对以下分镜脚本进行深度评估。

【待分析脚本】：
${script}

请输出一份专业的评估报告，必须包含以下 Markdown 模块：

### 📊 维度评分 (1-10分)
- **叙事节奏**: [分数] - 评价
- **视觉冲击**: [分数] - 评价
- **完播潜力**: [分数] - 评价
- **商业价值**: [分数] - 评价

### 💡 亮点与不足
- **亮点**: (列出3点)
- **不足**: (列出2点)

### 🚀 优化建议
请给出 3 条具体的修改建议，帮助提升脚本质量。`;
}

export function getSampleVideoPrompt() {
    return `电影感特写镜头，人物面部表情紧张，眼神中透露着决心，柔和的侧逆光勾勒出面部轮廓，背景虚化，浅景深效果，35mm镜头，f/2.8光圈，电影胶片质感，暖色调，轻微的颗粒感，专业电影摄影，8K分辨率`;
}

export function getSampleMusicAnalysis() {
    return `🎵 背景音乐推荐：
• 主旋律：紧张悬疑的弦乐合奏，以小提琴颤音和低音大提琴为主
• 情绪变化：从平静逐渐过渡到紧张高潮
• 推荐曲目：Hans Zimmer - Time (改编版)

🔊 环境音效：
• 城市背景：遥远的警笛声、汽车引擎声、人群嘈杂声
• 室内环境：时钟滴答声、呼吸声、地板吱呀声
• 特殊效果：心跳声放大处理、金属摩擦声

🎤 对白处理：
• 人物对白：清晰的人声，适当的混响效果
• 声音特效：对重要台词添加轻微的回声效果

💡 制作建议：
• 使用5.1声道环绕声设计
• 重点突出关键时刻的音效
• 保持音乐和音效的平衡`;
}
