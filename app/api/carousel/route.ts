import { NextRequest, NextResponse } from 'next/server';
// NextResponse imported for error responses below
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    let embedded;
    try {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        embedded = await pdfDoc.embedJpg(bytes);
      } else if (file.type === 'image/png') {
        embedded = await pdfDoc.embedPng(bytes);
      } else {
        continue;
      }
    } catch {
      continue;
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
