'use client';

import { PDFDocument } from 'pdf-lib';

async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target!.result as ArrayBuffer));
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function detectType(bytes: Uint8Array): 'jpeg' | 'png' {
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  return 'jpeg';
}

export async function generateCarouselPdf(files: File[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const PAGE = 1080;

  for (const file of files) {
    const bytes = await fileToBytes(file);
    const type = detectType(bytes);

    let embedded;
    try {
      embedded = type === 'png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
    } catch {
      try {
        embedded = type === 'png' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
      } catch {
        continue;
      }
    }

    const { width, height } = embedded;
    const scale = Math.min(PAGE / width, PAGE / height);
    const page = pdfDoc.addPage([PAGE, PAGE]);
    page.drawImage(embedded, {
      x: (PAGE - width * scale) / 2,
      y: (PAGE - height * scale) / 2,
      width: width * scale,
      height: height * scale,
    });
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error('Nenhuma imagem válida para o carrossel (use JPEG ou PNG)');
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
