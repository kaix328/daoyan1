// Basic color theory utilities

/**
 * Converts Hex to HSL
 * @param {string} hex 
 * @returns {{h: number, s: number, l: number}}
 */
export function hexToHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta === 0)
        h = 0;
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    else if (cmax === g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

/**
 * Converts HSL to Hex
 * @param {number} h 
 * @param {number} s 
 * @param {number} l 
 * @returns {string}
 */
export function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    if (r.length === 1) r = "0" + r;
    if (g.length === 1) g = "0" + g;
    if (b.length === 1) b = "0" + b;

    return "#" + r + g + b;
}

/**
 * Get simple color name from Hue
 */
export function getHueName(h) {
    if (h >= 345 || h < 15) return 'Red';
    if (h >= 15 && h < 45) return 'Orange';
    if (h >= 45 && h < 75) return 'Yellow';
    if (h >= 75 && h < 150) return 'Green';
    if (h >= 150 && h < 190) return 'Cyan';
    if (h >= 190 && h < 270) return 'Blue';
    if (h >= 270 && h < 315) return 'Purple';
    if (h >= 315 && h < 345) return 'Pink';
    return 'Color';
}

export function getHueNameCN(h) {
    if (h >= 345 || h < 15) return '红色 (Red)';
    if (h >= 15 && h < 45) return '橙色 (Orange)';
    if (h >= 45 && h < 75) return '黄色 (Yellow)';
    if (h >= 75 && h < 150) return '绿色 (Green)';
    if (h >= 150 && h < 190) return '青色 (Cyan)';
    if (h >= 190 && h < 270) return '蓝色 (Blue)';
    if (h >= 270 && h < 315) return '紫色 (Purple)';
    if (h >= 315 && h < 345) return '粉色 (Pink)';
    return '彩色';
}

/**
 * Generates harmony palette
 * @param {string} baseHex 
 * @param {'complementary'|'analogous'|'triadic'|'split'} type 
 */
export function generateHarmony(baseHex, type) {
    const { h, s, l } = hexToHSL(baseHex);
    let palette = [baseHex];
    let names = [getHueName(h)];

    // Helper to add color
    const addColor = (hueOffset) => {
        let newH = (h + hueOffset) % 360;
        if (newH < 0) newH += 360;
        palette.push(hslToHex(newH, s, l));
        names.push(getHueName(newH));
    };

    switch (type) {
        case 'complementary':
            addColor(180);
            break;
        case 'analogous':
            addColor(30);
            addColor(-30);
            break;
        case 'triadic':
            addColor(120);
            addColor(240);
            break;
        case 'split':
            addColor(150);
            addColor(210);
            break;
        default:
            break;
    }

    return { colors: palette, colorNames: names };
}
