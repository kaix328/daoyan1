export class LightingDiagram {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    draw(analysisText) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        
        // --- 1. 解析布光模式 ---
        let lights = [];
        const text = analysisText.toLowerCase();
        
        // 默认: 三点布光 (Three-Point Lighting)
        // Key Light (45deg), Fill Light (-45deg), Back Light (Behind)
        let mode = "标准三点布光";
        
        if (text.includes('伦勃朗') || text.includes('rembrandt')) {
            mode = "伦勃朗光 (Rembrandt)";
            lights.push({ type: '主光', angle: -45, dist: 80, intensity: 1.0, color: '#ffeb3b' }); // 左前上方
            lights.push({ type: '辅光', angle: 60, dist: 100, intensity: 0.3, color: '#ffffff' }); // 右侧较弱
        } 
        else if (text.includes('蝴蝶光') || text.includes('butterfly')) {
            mode = "蝴蝶光 (Butterfly)";
            lights.push({ type: '主光', angle: 0, dist: 80, intensity: 1.0, color: '#ffeb3b' }); // 正上方
            lights.push({ type: '发光', angle: 180, dist: 110, intensity: 0.4, color: '#88ccff' }); // 轮廓光
        }
        else if (text.includes('分割光') || text.includes('split') || text.includes('侧光')) {
            mode = "侧光/分割光 (Split)";
            lights.push({ type: '主光', angle: -90, dist: 90, intensity: 1.0, color: '#ffeb3b' }); // 正侧面
            lights.push({ type: '辅光', angle: 90, dist: 100, intensity: 0.2, color: '#ffffff' }); // 极弱补光
        }
        else if (text.includes('逆光') || text.includes('轮廓')) {
            mode = "逆光 (Backlight)";
            lights.push({ type: '主光', angle: 180, dist: 90, intensity: 1.0, color: '#ffeb3b' }); // 背后
            lights.push({ type: '反光板', angle: 0, dist: 90, intensity: 0.3, color: '#ffffff' }); // 正面补光
        }
        else {
            // Default: Generic 3-Point
            mode = "标准三点布光";
            lights.push({ type: '主光', angle: -45, dist: 90, intensity: 1.0, color: '#ffeb3b' });
            lights.push({ type: '辅光', angle: 45, dist: 100, intensity: 0.5, color: '#ffffff' });
            lights.push({ type: '轮廓光', angle: 160, dist: 110, intensity: 0.6, color: '#88ccff' });
        }

        // --- 2. 绘制基础场景 ---
        
        // Grid background
        this.drawGrid(ctx, w, h);

        // Subject (Top-down view with nose direction)
        ctx.save();
        ctx.translate(cx, cy);
        
        // Head
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#ccc';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Nose (Indicator of direction - facing down/camera)
        ctx.beginPath();
        ctx.moveTo(-4, 18);
        ctx.lineTo(0, 26);
        ctx.lineTo(4, 18);
        ctx.fillStyle = '#ccc';
        ctx.fill();
        
        // Shoulders
        ctx.beginPath();
        ctx.ellipse(0, 5, 35, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,200,200,0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.stroke();
        
        ctx.restore();

        // Camera
        this.drawCamera(ctx, cx, h - 30);

        // --- 3. 绘制光源 ---
        lights.forEach(light => {
            this.drawLight(ctx, cx, cy, light);
        });
        
        // --- 4. 绘制标签 ---
        ctx.fillStyle = '#666';
        ctx.font = '12px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`检测模式: ${mode}`, 10, 20);
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const step = 20;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
    }
    
    drawCamera(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#4da3ff';
        // Body
        ctx.fillRect(-10, 0, 20, 14);
        // Lens
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-3, -6);
        ctx.lineTo(3, -6);
        ctx.lineTo(6, 0);
        ctx.fill();
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CAM', 0, 22);
        ctx.restore();
    }

    drawLight(ctx, cx, cy, light) {
        // Angle definition:
        // 0 = Front (Camera position)
        // 90 = Right
        // -90 = Left
        // 180 = Back
        
        // Convert to Math Radians (where 0 is Right, 90 is Down)
        // Input 0 (Front/Bottom) -> Math 90 (PI/2)
        // Input 90 (Right) -> Math 0 (0)
        // Input -90 (Left) -> Math 180 (PI)
        
        const mathRad = (90 - light.angle) * (Math.PI / 180);
        
        const lx = cx + Math.cos(mathRad) * light.dist;
        const ly = cy + Math.sin(mathRad) * light.dist;
        
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(mathRad + Math.PI); // Point towards center
        
        // Light Cone (Beam)
        const beamLen = light.dist - 25; // Stop before subject
        const gradient = ctx.createLinearGradient(0, 0, beamLen, 0);
        gradient.addColorStop(0, `rgba(${this.hexToRgb(light.color)}, 0.3)`);
        gradient.addColorStop(1, `rgba(${this.hexToRgb(light.color)}, 0)`);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(beamLen, -12); // Narrow beam
        ctx.lineTo(beamLen, 12);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Light Head
        ctx.beginPath();
        // Rectangular softbox shape or circle depending on type? Let's use generic symbol
        ctx.rect(-8, -8, 16, 16);
        ctx.fillStyle = light.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = light.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Barn doors (visual flair)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, -8); ctx.lineTo(12, -12);
        ctx.moveTo(8, 8); ctx.lineTo(12, 12);
        ctx.stroke();
        
        // Label
        ctx.rotate(-(mathRad + Math.PI)); // Unrotate for text
        ctx.fillStyle = '#ddd';
        ctx.font = '10px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(light.type, 0, -12);
        
        ctx.restore();
    }
    
    hexToRgb(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
    
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255,255,255';
    }
}

export class FocalLengthSimulator {
    constructor(canvasId) {
        // Placeholder implementation to satisfy imports
        this.canvas = document.getElementById(canvasId);
    }

    simulate(focalLength) {
        console.log(`Focal length simulation not yet implemented for: ${focalLength}`);
    }
}
