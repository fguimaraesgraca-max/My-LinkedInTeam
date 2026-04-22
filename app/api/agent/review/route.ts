import { NextRequest, NextResponse } from 'next/server';
import { runReviewerAgent, AgentInput } from '@/lib/agents';

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

  const reviewed = await runReviewerAgent(body.draft, input);
  return NextResponse.json({ reviewed });
}
