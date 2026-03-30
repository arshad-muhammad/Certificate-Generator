import { TemplateConfig, CsvRow } from '../types';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import Konva from 'konva';

export async function generateCertificates(
  config: TemplateConfig,
  csvData: CsvRow[],
  format: 'pdf' | 'pdf-single' | 'png',
  onProgress: (progress: number) => void,
  fileNameColumn?: string
) {
  if (!config.backgroundImage) {
    throw new Error('No template image found');
  }

  const zip = new JSZip();
  let singlePdf: jsPDF | null = null;

  // Load background image
  const img = new Image();
  img.src = config.backgroundImage;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  if (format === 'pdf-single') {
    singlePdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height],
      compress: true
    });
  }

  // Create off-screen stage
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const stage = new Konva.Stage({
    container,
    width: img.width,
    height: img.height,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  // Add a white background to prevent transparent PNGs from turning black when exported as JPEG
  const whiteBg = new Konva.Rect({
    x: 0,
    y: 0,
    width: img.width,
    height: img.height,
    fill: 'white',
  });
  layer.add(whiteBg);

  const bgImage = new Konva.Image({
    image: img,
    width: img.width,
    height: img.height,
  });
  layer.add(bgImage);

  const textNodes = config.placeholders.map(p => {
    const textNode = new Konva.Text({
      x: p.x,
      y: p.y,
      fontSize: p.fontSize,
      fontFamily: p.fontFamily,
      fontStyle: `${p.fontWeight === 'bold' ? 'bold' : ''} ${p.fontStyle === 'italic' ? 'italic' : ''}`.trim() || 'normal',
      fill: p.fill,
      align: p.align,
      width: p.width,
      letterSpacing: p.letterSpacing,
      lineHeight: p.lineHeight,
      opacity: p.opacity,
      rotation: p.rotation,
    });
    layer.add(textNode);
    return { node: textNode, config: p };
  });

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    
    textNodes.forEach(({ node, config: p }) => {
      let text = p.text;
      if (p.columnName && row[p.columnName]) {
        text = row[p.columnName];
      }

      if (p.textTransform === 'uppercase') text = text.toUpperCase();
      if (p.textTransform === 'lowercase') text = text.toLowerCase();
      if (p.textTransform === 'capitalize') {
        text = text.replace(/\b\w/g, c => c.toUpperCase());
      }

      node.text(text);
    });

    layer.draw();

    const isPdf = format.startsWith('pdf');
    const mimeType = isPdf ? 'image/jpeg' : 'image/png';
    
    // Scale down excessively large images to prevent memory issues
    const maxDimension = Math.max(img.width, img.height);
    const pixelRatio = maxDimension > 2000 ? 2000 / maxDimension : 1;
    
    const dataUrl = stage.toDataURL({ 
      pixelRatio, 
      mimeType, 
      quality: 0.8 
    });
    
    let fileName = `certificate_${i + 1}`;
    
    if (fileNameColumn && row[fileNameColumn]) {
      // Sanitize file name
      fileName = String(row[fileNameColumn]).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    } else if (row['certificate_id']) {
      fileName = `certificate_${row['certificate_id']}`;
    } else if (row['id']) {
      fileName = `certificate_${row['id']}`;
    }

    if (format === 'pdf-single' && singlePdf) {
      if (i > 0) {
        singlePdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
      }
      singlePdf.addImage(dataUrl, isPdf ? 'JPEG' : 'PNG', 0, 0, img.width, img.height, undefined, 'FAST');
    } else if (format === 'png') {
      const base64Data = dataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
      zip.file(`${fileName}.png`, base64Data, { base64: true });
    } else {
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
        compress: true
      });
      pdf.addImage(dataUrl, isPdf ? 'JPEG' : 'PNG', 0, 0, img.width, img.height, undefined, 'FAST');
      const pdfBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      zip.file(`${fileName}.pdf`, pdfBlob);
    }

    onProgress(Math.round(((i + 1) / csvData.length) * 100));
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (format === 'pdf-single' && singlePdf) {
    const pdfBuffer = singlePdf.output('arraybuffer');
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    saveAs(blob, 'all_certificates.pdf');
  } else {
    const content = await zip.generateAsync({ type: 'uint8array' });
    const blob = new Blob([content], { type: 'application/zip' });
    saveAs(blob, `certificates_${format}.zip`);
  }
  
  stage.destroy();
  document.body.removeChild(container);
  toast.success('Certificates generated successfully!');
}
