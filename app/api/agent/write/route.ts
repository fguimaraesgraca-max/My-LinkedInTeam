import { NextRequest, NextResponse } from 'next/server';
import { runWriterAgent, AgentInput } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const input: AgentInput = {
    title: body.title,
    description: body.description,
    link: body.link,
    tone: body.tone,
    language: body.language,
    length: body.length,
    audience: body.audience,
    imageCount: body.imageCount,
  };

  try {
    const draft = await runWriterAgent(input);
    return NextResponse.json({ draft });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
