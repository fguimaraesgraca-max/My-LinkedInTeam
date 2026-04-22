import { NextRequest, NextResponse } from 'next/server';
import { runWriterAgent, AgentInput } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const input: AgentInput = {
    title: body.title,
    description: body.description,
    link: body.link,
    tone: body.tone,
    language: body.language,
    audience: body.audience,
    imageCount: body.imageCount,
  };

  const draft = await runWriterAgent(input);
  return NextResponse.json({ draft });
}
