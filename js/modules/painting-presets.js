export const PAINTING_STYLES = [
    { id: 'oil', name: '古典油画 (Classical Oil)', prompt: 'classical oil painting', promptCN: '古典油画' },
    { id: 'water', name: '水彩画 (Watercolor)', prompt: 'watercolor painting', promptCN: '水彩画' },
    { id: 'digital', name: '数字厚涂 (Digital Impasto)', prompt: 'digital impasto', promptCN: '数字厚涂' },
    { id: 'concept', name: '概念艺术 (Concept Art)', prompt: 'concept art', promptCN: '概念艺术' },
    { id: 'anime', name: '日系赛璐珞 (Cel Shading)', prompt: 'anime style, cel shaded', promptCN: '日系动画，赛璐珞上色' },
    { id: 'ink', name: '水墨画 (Ink Wash)', prompt: 'ink wash painting, sumi-e', promptCN: '水墨画' },
    { id: 'sketch', name: '素描 (Pencil Sketch)', prompt: 'pencil sketch, graphite', promptCN: '铅笔素描' },
    { id: 'pixel', name: '像素艺术 (Pixel Art)', prompt: 'pixel art, 16-bit', promptCN: '像素艺术' },
    { id: 'ukiyo', name: '浮世绘 (Ukiyo-e)', prompt: 'ukiyo-e woodblock print', promptCN: '浮世绘木刻' }
];

export const MEDIUMS = [
    { id: 'none', name: '默认 (Default)', prompt: '', promptCN: '' },
    { id: 'canvas', name: '画布 (Canvas)', prompt: 'on canvas, textured surface', promptCN: '画布纹理' },
    { id: 'paper', name: '水彩纸 (Rough Paper)', prompt: 'on rough watercolor paper', promptCN: '粗糙水彩纸' },
    { id: 'gouche', name: '水粉 (Gouache)', prompt: 'gouache medium, matte finish', promptCN: '水粉材质，哑光' },
    { id: 'acrylic', name: '丙烯 (Acrylic)', prompt: 'acrylic paint, plastic texture', promptCN: '丙烯颜料' },
];

export const TECHNIQUES = [
    { id: 'none', name: '默认 (Default)', prompt: '', promptCN: '' },
    { id: 'impasto', name: '厚涂 (Impasto)', prompt: 'heavy impasto, thick brushstrokes', promptCN: '重厚涂，厚笔触' },
    { id: 'glazing', name: '罩染 (Glazing)', prompt: 'glazing technique, translucent layers', promptCN: '罩染技法，半透明层' },
    { id: 'wet', name: '湿画法 (Wet-on-Wet)', prompt: 'wet-on-wet technique, blending colors', promptCN: '湿画法，色彩融合' },
    { id: 'palette_knife', name: '刮刀 (Palette Knife)', prompt: 'palette knife texture, abstract edges', promptCN: '刮刀纹理，抽象边缘' },
    { id: 'line', name: '线描 (Line Art)', prompt: 'strong line art, clean outlines', promptCN: '强烈的线稿，清晰轮廓' },
];

export const ARTISTS = [
    { name: '无 (None)', val: '' },
    { name: 'Greg Rutkowski (奇幻)', val: 'Greg Rutkowski' },
    { name: 'Alphonse Mucha (慕夏)', val: 'Alphonse Mucha' },
    { name: 'Claude Monet (莫奈)', val: 'Claude Monet' },
    { name: 'Vincent van Gogh (梵高)', val: 'Vincent van Gogh' },
    { name: 'Zdzisław Beksiński (黑暗)', val: 'Zdzisław Beksiński' },
    { name: 'Makoto Shinkai (新海诚)', val: 'Makoto Shinkai' },
    { name: 'WLOP (唯美)', val: 'WLOP' },
    { name: 'Kim Jung Gi (速写)', val: 'Kim Jung Gi' },
    { name: 'Edward Hopper (孤独)', val: 'Edward Hopper' }
];
