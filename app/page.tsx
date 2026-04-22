'use client';

import { useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import PostForm, { FormValues } from '@/components/PostForm';
import AgentProgress, { AgentState } from '@/components/AgentProgress';
import PostResult from '@/components/PostResult';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>({
    writer: 'idle',
    reviewer: 'idle',
    formatter: 'idle',
  });
  const [finalPost, setFinalPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [carouselUrl, setCarouselUrl] = useState('');
  const [lastForm, setLastForm] = useState<FormValues | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const generate = async (form: FormValues) => {
    setIsGenerating(true);
    setFinalPost('');
    setCarouselUrl('');
    setImages(form.images);
    setLastForm(form);
    setAgentState({ writer: 'idle', reviewer: 'idle', formatter: 'idle' });

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('link', form.link);
    fd.append('tone', form.tone);
    fd.append('language', form.language);
    fd.append('audience', form.audience);
    fd.append('imageCount', String(form.images.length));

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: fd });

      if (!res.ok || !res.body) {
        throw new Error('Falha na resposta do servidor');
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += dec.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const line = block.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));

            if (ev.type === 'progress') {
              setAgentState((prev) => {
                const next = { ...prev };
                if (ev.agent === 'writer') {
                  next.writer = ev.status;
                  if (ev.content) next.writerContent = ev.content;
                } else if (ev.agent === 'reviewer') {
                  next.reviewer = ev.status;
                  if (ev.content) next.reviewerContent = ev.content;
                } else if (ev.agent === 'formatter') {
                  next.formatter = ev.status;
                  if (ev.content) next.formatterContent = ev.content;
                }
                return next;
              });
            } else if (ev.type === 'complete') {
              setFinalPost(ev.content);
              setTimeout(
                () => resultRef.current?.scrollIntoView({ behavior: 'smooth' }),
                200
              );
            } else if (ev.type === 'error') {
              console.error('Agent error:', ev.message);
            }
          } catch {
            // Ignore malformed events
          }
        }
      }

      // Generate carousel PDF if images were uploaded
      if (form.images.length > 0) {
        const cfd = new FormData();
        form.images.forEach((img) => cfd.append('images', img));
        const cres = await fetch('/api/carousel', { method: 'POST', body: cfd });
        if (cres.ok) {
          const blob = await cres.blob();
          setCarouselUrl(URL.createObjectURL(blob));
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-linkedin-bg">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linkedin-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">My LinkedIn Team</h1>
              <p className="text-[11px] text-gray-500 leading-tight">Equipe IA para posts profissionais</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              3 agentes ativos
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Intro */}
        {!isGenerating && !finalPost && (
          <div className="bg-gradient-to-r from-linkedin-blue to-linkedin-dark rounded-xl p-5 text-white">
            <h2 className="text-lg font-bold mb-1">
              Olá! Sua equipe IA está pronta 🤝
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              Preencha as informações abaixo e nossa equipe de três agentes — Redator, Revisor e
              Formatador — criará um post profissional e personalizado para o seu LinkedIn.
            </p>
            <div className="flex gap-3 mt-3">
              {['✍️ Redator', '🔍 Revisor', '✨ Formatador'].map((agent) => (
                <span
                  key={agent}
                  className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>
        )}

        <PostForm onGenerate={generate} isGenerating={isGenerating} />

        {(isGenerating || agentState.writer !== 'idle' || finalPost) && (
          <AgentProgress state={agentState} />
        )}

        {finalPost && (
          <div ref={resultRef}>
            <PostResult
              post={finalPost}
              carouselUrl={carouselUrl}
              imageCount={images.length}
              onRegenerate={lastForm ? () => generate(lastForm) : undefined}
            />
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        My LinkedIn Team — Powered by Claude Opus 4.7
      </footer>
    </main>
  );
}
