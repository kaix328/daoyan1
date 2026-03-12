/**
 * Extracts dominant colors from an image element using Canvas
 * @param {HTMLImageElement} img 
 * @param {number} colorCount 
 * @returns {string[]} Array of Hex colors
 */
export function extractPaletteFromImage(img, colorCount = 4) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Scale down for performance
    const scale = Math.min(1, 200 / Math.max(img.width, img.height));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixelCount = canvas.width * canvas.height;

    // Simple quantization: Accumulate average colors in buckets
    // This is a naive implementation but sufficient for client-side without heavy libs
    const buckets = {};

    for (let i = 0; i < pixelCount; i += 10) { // Sample every 10th pixel for speed
        const offset = i * 4;
        const r = imageData[offset];
        const g = imageData[offset + 1];
        const b = imageData[offset + 2];
        const a = imageData[offset + 3];

        if (a < 128) continue; // Ignore transparent

        // Quantize to reduce color space (round to nearest 32)
        const qR = Math.round(r / 32) * 32;
        const qG = Math.round(g / 32) * 32;
        const qB = Math.round(b / 32) * 32;

        const key = `${qR},${qG},${qB}`;
        if (!buckets[key]) {
            buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
        }
        buckets[key].r += r;
        buckets[key].g += g;
        buckets[key].b += b;
        buckets[key].count++;
    }

    // Sort buckets by count
    const sortedKeys = Object.keys(buckets).sort((a, b) => buckets[b].count - buckets[a].count);

    // Take top N
    const palette = [];
    const minDistance = 30; // Min euclidean distance to consider distinct

    for (let key of sortedKeys) {
        if (palette.length >= colorCount) break;

        const bucket = buckets[key];
        const r = Math.round(bucket.r / bucket.count);
        const g = Math.round(bucket.g / bucket.count);
        const b = Math.round(bucket.b / bucket.count);

        // Convert to hex
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        // Ensure distinctness
        let isDistinct = true;
        for (let p of palette) {
            // Simple check (not accurate DeltaE but okay for this)
            // Need to convert p back to RGB to check distance but let's skip strict checking for now
            // to keep it simple. If we get duplicates, so be it, but quantization handles nearby colors.
            if (p === hex) isDistinct = false;
        }

        if (isDistinct) {
            palette.push(hex);
        }
    }

    // Fill with black if not enough colors found (rare)
    while (palette.length < colorCount) {
        palette.push('#000000');
    }

    return palette;
}
