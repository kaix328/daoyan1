export const exportToPDF = async (data, images) => {
    // Check if libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
        alert("PDF导出组件未加载，请检查网络连接。\nPDF libraries not loaded. Please check your internet connection.");
        return;
    }

    const { jsPDF } = window.jspdf;

    try {
        // Create a temporary container for rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '800px'; // A4 width approx in pixels at 96dpi is ~794
        tempDiv.style.background = '#ffffff';
        tempDiv.style.color = '#000000';
        tempDiv.style.padding = '40px';
        tempDiv.style.fontFamily = "'Noto Sans SC', sans-serif";
        
        // Build content
        let imagesHtml = '';
        if (images && images.length > 0) {
            imagesHtml = `<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                ${images.map(img => `<img src="${img.data}" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd;">`).join('')}
            </div>`;
        }

        const analysisText = document.getElementById('analysisResult').innerHTML;

        tempDiv.innerHTML = `
            <h1 style="border-bottom: 2px solid #333; padding-bottom: 10px;">🎬 导演分镜通告单</h1>
            <div style="color: #666; margin-bottom: 20px;">项目: AI 导演助手 | 日期: ${new Date().toLocaleDateString()}</div>
            ${imagesHtml}
            <div style="font-size: 14px; line-height: 1.6;">${analysisText}</div>
        `;

        document.body.appendChild(tempDiv);

        // Render to canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`分镜分析报告_${Date.now()}.pdf`);

    } catch (e) {
        console.error("PDF Export Error:", e);
        alert("导出PDF失败，请重试。\nExport failed: " + e.message);
    }
};
