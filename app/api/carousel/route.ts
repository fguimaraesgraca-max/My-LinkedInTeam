import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';
export const maxDuration = 60;

function detectImageType(bytes: Uint8Array): 'jpeg' | 'png' | null {
  if (bytes.length < 4) return null;
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
  return null;
}

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const images = data.getAll('images') as File[];

  if (images.length === 0) {
    return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
  }

  const pdfDoc = await PDFDocument.create();
  const PAGE = 1080;

  for (const file of images) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect by magic bytes first (more reliable than MIME type on mobile)
    const detected = detectImageType(bytes);
    const mimeHint = file.type === 'image/png' ? 'png' : 'jpeg';
    const imageType = detected ?? mimeHint;

    let embedded;
    try {
      embedded = imageType === 'png'
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    } catch {
      // Fallback: try the other format
      try {
        embedded = imageType === 'png'
          ? await pdfDoc.embedJpg(bytes)
          : await pdfDoc.embedPng(bytes);
      } catch {
        continue;
      }
    }

    const { width, height } = embedded;
    const scale = Math.min(PAGE / width, PAGE / height);
    const w = width * scale;
    const h = height * scale;

    const page = pdfDoc.addPage([PAGE, PAGE]);
    page.drawImage(embedded, {
      x: (PAGE - w) / 2,
      y: (PAGE - h) / 2,
      width: w,
      height: h,
    });
  }

  if (pdfDoc.getPageCount() === 0) {
    return NextResponse.json(
      { error: 'Nenhuma imagem válida (use JPEG ou PNG)' },
      { status: 400 }
    );
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="linkedin-carousel.pdf"',
    },
  });
}
