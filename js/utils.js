export function isImageFile(file) {
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    return acceptedTypes.includes(file.type);
}

export function checkImageQuality(img) {
    const result = {
        isGoodQuality: true,
        message: '',
        resolution: `${img.width}×${img.height}`,
        aspectRatio: (img.width / img.height).toFixed(2)
    };

    // 检查分辨率
    if (img.width < 300 || img.height < 300) {
        result.isGoodQuality = false;
        result.message = '分辨率过低';
    }

    // 检查宽高比（极端比例可能影响识别）
    if (img.width / img.height > 4 || img.height / img.width > 4) {
        result.isGoodQuality = false;
        result.message = '宽高比极端';
    }

    return result;
}

export function formatResult(result) {
    if (!result) return '';
    
    // Use marked library if available, otherwise fallback to simple text
    if (typeof marked !== 'undefined') {
        // Configure marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        const htmlContent = marked.parse(result);
        
        // Post-process HTML to wrap sections in cards
        // Create a temporary container
        const div = document.createElement('div');
        div.innerHTML = htmlContent;
        
        const newContainer = document.createElement('div');
        newContainer.className = 'analysis-report-container';
        
        let currentSection = null;
        let currentBody = null;
        
        const finishSection = () => {
            if (currentSection) {
                if (currentBody) currentSection.appendChild(currentBody);
                newContainer.appendChild(currentSection);
                currentSection = null;
                currentBody = null;
            }
        };

        Array.from(div.children).forEach(child => {
            // Check if it's a heading (H1, H2, H3)
            if (child.tagName.match(/^H[1-3]$/)) {
                finishSection();
                
                // Start new section
                currentSection = document.createElement('section');
                currentSection.className = 'analysis-card';
                
                // Add icon to heading based on text
                const iconMap = {
                    '场景': 'fa-film',
                    'Scene': 'fa-film',
                    '光影': 'fa-lightbulb',
                    'Lighting': 'fa-lightbulb',
                    '色彩': 'fa-palette',
                    'Color': 'fa-palette',
                    '构图': 'fa-crop-alt',
                    'Composition': 'fa-crop-alt',
                    '运镜': 'fa-video',
                    'Camera': 'fa-video',
                    '情感': 'fa-heart',
                    'Mood': 'fa-heart',
                    '建议': 'fa-clipboard-check',
                    'Suggestion': 'fa-clipboard-check',
                    '总结': 'fa-star',
                    'Summary': 'fa-star'
                };
                
                let iconClass = 'fa-circle'; // Default
                for (const key in iconMap) {
                    if (child.innerText.includes(key)) {
                        iconClass = iconMap[key];
                        break;
                    }
                }
                
                // Create Header
                const header = document.createElement('div');
                header.className = 'card-title';
                header.innerHTML = `<i class="fas ${iconClass}"></i> ${child.innerHTML}`;
                
                currentSection.appendChild(header);
                
                // Create Body
                currentBody = document.createElement('div');
                currentBody.className = 'card-body';
            } else {
                // If no section started yet (e.g. intro text), create one
                if (!currentSection) {
                    currentSection = document.createElement('section');
                    currentSection.className = 'analysis-card intro-card';
                    currentBody = document.createElement('div');
                    currentBody.className = 'card-body';
                }
                // Append content to current body
                currentBody.appendChild(child.cloneNode(true)); 
            }
        });
        
        finishSection();
        
        return newContainer.outerHTML;
    }

    // Fallback (legacy regex)
    // 将Markdown样式的标题转换为HTML
    let formatted = result
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^### (.*$)/gim, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>') // Handle list items
        .replace(/<\/li>\n<li>/g, '</li><li>') // Merge list items
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>') // Wrap lists (simplified)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // 添加图标到标题
    formatted = formatted.replace(/<h3>🎬 (.*?)<\/h3>/g, '<h3><i class="fas fa-theater-masks"></i> $1</h3>');
    formatted = formatted.replace(/<h3>📹 (.*?)<\/h3>/g, '<h3><i class="fas fa-camera"></i> $1</h3>');
    formatted = formatted.replace(/<h3>🔭 (.*?)<\/h3>/g, '<h3><i class="fas fa-sliders-h"></i> $1</h3>');
    formatted = formatted.replace(/<h3>🎥 (.*?)<\/h3>/g, '<h3><i class="fas fa-video"></i> $1</h3>');
    formatted = formatted.replace(/<h3>💡 (.*?)<\/h3>/g, '<h3><i class="fas fa-lightbulb"></i> $1</h3>');

    // 包装在段落中
    formatted = `<div class="result-content-inner"><p>${formatted}</p></div>`;

    return formatted;
}

export function saveResultToFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadText(content, filename) {
    saveResultToFile(content, filename);
}

export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        throw err;
    }
}

/**
 * Compress an image file/blob to a specific max dimension and quality
 * @param {File|Blob|string} source - File object, Blob, or Base64 string
 * @param {number} maxWidth - Maximum width/height
 * @param {number} quality - JPEG quality (0.0 to 1.0)
 * @returns {Promise<string>} - Resized Base64 string
 */
export function compressImage(source, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };
        img.onerror = (e) => reject(e);

        if (typeof source === 'string' && source.startsWith('data:')) {
            img.src = source;
        } else if (source instanceof Blob || source instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.readAsDataURL(source);
        } else {
            reject(new Error('Invalid source type'));
        }
    });
}
