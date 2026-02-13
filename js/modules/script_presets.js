export const SCRIPT_CATEGORIES = {
    "产品广告": ["快消品", "科技产品", "奢侈品", "服务类", "食品饮料"],
    "品牌故事": ["品牌起源", "品牌理念", "社会责任", "用户故事"],
    "创意短片": ["微电影", "实验短片", "动画脚本", "纪录片"],
    "社交媒体": ["TikTok风格", "Instagram Reels", "YouTube短片", "Vlog"],
    "公益广告": ["环保", "教育", "健康", "社会公益"],
    "商业宣传": ["企业宣传片", "招商片", "年会视频"],
    "知识/IP打造": ["口播思维类", "技能干货类", "避坑指南", "行业洞察"],
    "直播带货": ["单品引爆脚本", "直播间切片", "活动预热", "憋单话术"],
    "AI/科技演示": ["工具评测", "操作流展示", "黑科技揭秘", "极客开箱"]
};

export const PLATFORM_STYLES = {
    "通用": "标准短视频风格，兼顾各平台特点。",
    "抖音/快手": "极快节奏，黄金3秒原则，强视觉冲击，使用热门BGM建议，文案口语化且有梗。",
    "小红书": "精致感，注重封面和标题，语气亲切（集美/宝子），侧重种草和生活方式分享。",
    "B站": "干货满满，逻辑严密，可以适当玩梗，支持中长视频结构，重视弹幕互动点。",
    "视频号": "沉稳大气，正能量，适合成熟人群，注重情感连接和实用价值。",
    "TikTok Global": "国际化叙事，强视觉引导，少依赖语言梗，夸张肢体语言，欧美流行节奏。",
    "LinkedIn": "专业商务风，数据驱动，行业洞察深度，适合B2B决策者观看。",
    "Instagram Reels": "视觉美学优先，转场丝滑，音乐卡点精准，强调生活方式的格调感。"
};

export const NARRATIVE_MODELS = {
    "默认": "标准分镜结构",
    "黄金圈 (Why-How-What)": "先讲理念/初衷(Why)，再讲实现方式(How)，最后展示产品(What)。适合品牌故事。",
    "SCQA (情境-冲突-问题-答案)": "建立情境(S)，引出冲突(C)，提出问题(Q)，给出方案(A)。适合咨询、干货科普。",
    "AIDA (注意-兴趣-欲望-行动)": "抓眼球(A) -> 提兴趣(I) -> 种草(D) -> 促下单(A)。适合硬广转化。",
    "英雄之旅 (简化版)": "平凡世界 -> 冒险召唤 -> 遭遇试炼 -> 获得宝物 -> 归来。适合人物纪录片、创业故事。",
    "痛点-放大-解决 (PAS)": "指出痛点 -> 放大后果(制造焦虑) -> 给出完美解药。适合带货、知识付费。"
};

export const VISUAL_STYLES = [
    "默认 (Default)",
    "赛博朋克 (Cyberpunk)",
    "极简主义 (Minimalist)",
    "韦斯·安德森对称美学 (Wes Anderson)",
    "胶片复古 (Vintage Film)",
    "吉卜力动漫 (Ghibli Anime)",
    "黑白黑色电影 (Film Noir)",
    "高饱和多巴胺 (Dopamine Bright)",
    "低保真/蒸汽波 (Lo-Fi/Vaporwave)"
];

export const PACING_MODES = [
    "默认 (Default)",
    "快节奏/卡点 (Fast/Rhythmic) - 适合抖音/TikTok",
    "舒缓/治愈 (Slow/Healing) - 适合Vlog/B站",
    "循序渐进 (Progressive) - 适合品牌故事",
    "鬼畜/高频重复 (Repetitive/Viral) - 适合洗脑广告"
];

export const VIRAL_HOOKS = [
    "默认 (Default)",
    "视觉奇观 (Visual Spectacle) - 用离谱画面吸睛",
    "痛点直击 (Direct Pain) - '你是不是也经常...'",
    "反差/悬念 (Contrast/Suspense) - '没想到结果竟然...'",
    "争议性观点 (Controversy) - 制造评论区对立",
    "数据/权威背书 (Data/Authority) - '90%的人都不知道...'"
];

export const CTA_TYPES = [
    "默认 (Default)",
    "关注账号 (Follow)",
    "点赞收藏 (Like & Save)",
    "评论区互动 (Comment)",
    "点击链接购买 (Buy Link)",
    "品牌形象强化 (Brand Awareness)"
];

// --- Professional Upgrades ---

export const CASTING_OPTIONS = {
    age_groups: ["不限", "Z世代 (18-24)", "千禧一代 (25-40)", "中年 (40-60)", "银发族 (60+)"],
    archetypes: ["不限", "商务精英", "极客/技术宅", "家庭主妇/夫", "学生/校园", "蓝领工匠", "时尚达人", "艺术家"],
    acting_styles: ["默认", "自然生活化 (Natural)", "戏剧夸张 (Theatrical)", "冷面滑稽 (Deadpan)", "专业权威 (Authoritative)", "亲切邻家 (Friendly)"]
};

export const CINEMATOGRAPHY_SPECS = {
    aspect_ratios: ["9:16 (抖音/TikTok)", "16:9 (横屏/电影)", "4:5 (小红书/IG)", "1:1 (正方形)", "2.35:1 (宽银幕)"],
    shot_sizes: ["默认 (混合)", "特写为主 (Close-up Heavy)", "广角为主 (Wide Shot Heavy)", "中景叙事 (Medium Shot)", "动态跟拍 (Tracking Shot)"],
    lighting_keys: ["默认", "高调 (High Key - 明亮)", "低调 (Low Key - 神秘)", "自然光 (Natural)", "赛博霓虹 (Neon)", "伦勃朗光 (Rembrandt)"]
};

export const SOUND_DESIGN = {
    voice_styles: ["默认", "深沉男声", "知性女声", "活泼童声", "AI电子音", "ASMR耳语", "激情解说"],
    music_genres: ["默认", "Lo-Fi Hip Hop", "Cinematic Orchestral", "Corporate Upbeat", "Trap/Phonk", "Acoustic Folk", "Electronic/House"]
};

export const VISUAL_STYLE_DESCRIPTIONS = {
    "默认": "符合现代审美的标准商业视频风格，光线自然，色彩还原度高。",
    "赛博朋克": "高对比度霓虹色调（蓝紫/粉红），未来科技感，阴雨天城市夜景，机械义肢元素。",
    "极简主义": "大面积留白，低饱和度莫兰迪色系，构图干净，强调几何线条与秩序感。",
    "韦斯·安德森": "极致的中心对称构图，高饱和度复古配色（粉/黄/蓝），平视机位，童话般的舞台感。",
    "胶片复古": "模拟胶片颗粒感，暖色调偏黄，暗角，漏光效果，怀旧情感氛围。",
    "吉卜力动漫": "宫崎骏手绘风格，明亮清新的蓝天白云草地，治愈系色彩，充满生活气息的细节。",
    "黑白黑色电影": "高反差黑白摄影，强烈的明暗对比（Chiaroscuro），阴影浓重，悬疑压抑氛围。",
    "高饱和多巴胺": "极其鲜艳明亮的色彩，高饱和度，充满活力与快乐情绪，强烈的视觉冲击。",
    "低保真/蒸汽波": "复古VHS录像带画质，故障艺术（Glitch），粉紫霓虹色，80/90年代怀旧美学。"
};
