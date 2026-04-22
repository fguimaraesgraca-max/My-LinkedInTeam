import { NextRequest } from 'next/server';
import { runWriterAgent, runReviewerAgent, runFormatterAgent, AgentInput } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const data = await request.formData();

  const input: AgentInput = {
    title: data.get('title') as string,
    description: data.get('description') as string,
    link: (data.get('link') as string) || undefined,
    tone: data.get('tone') as AgentInput['tone'],
    language: data.get('language') as AgentInput['language'],
    audience: data.get('audience') as string,
    imageCount: parseInt((data.get('imageCount') as string) || '0', 10),
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        send({ type: 'progress', agent: 'writer', status: 'working' });
        const draft = await runWriterAgent(input);
        send({ type: 'progress', agent: 'writer', status: 'done', content: draft });

        send({ type: 'progress', agent: 'reviewer', status: 'working' });
        const reviewed = await runReviewerAgent(draft, input);
        send({ type: 'progress', agent: 'reviewer', status: 'done', content: reviewed });

        send({ type: 'progress', agent: 'formatter', status: 'working' });
        const final = await runFormatterAgent(reviewed, input);
        send({ type: 'progress', agent: 'formatter', status: 'done', content: final });

        send({ type: 'complete', content: final });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
