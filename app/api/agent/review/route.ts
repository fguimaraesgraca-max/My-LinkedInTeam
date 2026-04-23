import { NextRequest, NextResponse } from 'next/server';
import { runReviewerAgent, AgentInput } from '@/lib/agents';

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
    audience: body.audience,
    imageCount: body.imageCount,
  };

  try {
    const reviewed = await runReviewerAgent(body.draft, input);
    return NextResponse.json({ reviewed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
