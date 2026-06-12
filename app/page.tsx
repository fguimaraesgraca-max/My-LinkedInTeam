'use client';

import { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import PostForm, { FormValues } from '@/components/PostForm';
import AgentProgress, { AgentState } from '@/components/AgentProgress';
import PostResult from '@/components/PostResult';
import PostHistory from '@/components/PostHistory';
import {
  HistoryEntry,
  loadHistory,
  saveToHistory,
  removeFromHistory,
  blobUrlToBase64,
} from '@/lib/history';

export default function Home() {
  const [tab, setTab] = useState<'create' | 'history'>('create');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const refreshHistory = () => setHistory(loadHistory());

  const handleDelete = (id: string) => {
    removeFromHistory(id);
    refreshHistory();
  };

  const generate = async (form: FormValues) => {
    setIsGenerating(true);
    setFinalPost('');
    setCarouselUrl('');
    setImages(form.images);
    setLastForm(form);
    setAgentState({ writer: 'idle', reviewer: 'idle', formatter: 'idle' });

    const body = {
      title: form.title,
      description: form.description,
      link: form.link,
      tone: form.tone,
      language: form.language,
      length: form.length,
      audience: form.audience,
      imageCount: form.images.length,
    };

    try {
      // Writer agent
      setAgentState((prev) => ({ ...prev, writer: 'working' }));
      const writeRes = await fetch('/api/agent/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!writeRes.ok) {
        const err = await writeRes.json().catch(() => ({}));
        throw new Error(err?.error || `Redator falhou (${writeRes.status})`);
      }
      const { draft } = await writeRes.json();
      setAgentState((prev) => ({ ...prev, writer: 'done', writerContent: draft }));

      // Reviewer agent
      setAgentState((prev) => ({ ...prev, reviewer: 'working' }));
      const reviewRes = await fetch('/api/agent/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, draft }),
      });
      if (!reviewRes.ok) {
        const err = await reviewRes.json().catch(() => ({}));
        throw new Error(err?.error || `Revisor falhou (${reviewRes.status})`);
      }
      const { reviewed } = await reviewRes.json();
      setAgentState((prev) => ({ ...prev, reviewer: 'done', reviewerContent: reviewed }));

      // Formatter agent
      setAgentState((prev) => ({ ...prev, formatter: 'working' }));
      const formatRes = await fetch('/api/agent/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, reviewed }),
      });
      if (!formatRes.ok) {
        const err = await formatRes.json().catch(() => ({}));
        throw new Error(err?.error || `Formatador falhou (${formatRes.status})`);
      }
      const { formatted } = await formatRes.json();
      setAgentState((prev) => ({ ...prev, formatter: 'done', formatterContent: formatted }));

      setFinalPost(formatted);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);

      // Generate carousel PDF only if images uploaded and toggle enabled
      let localCarouselUrl = '';
      if (form.images.length > 0 && form.generateCarousel) {
        const cfd = new FormData();
        form.images.forEach((img) => cfd.append('images', img));
        const cres = await fetch('/api/carousel', { method: 'POST', body: cfd });
        if (cres.ok) {
          const blob = await cres.blob();
          localCarouselUrl = URL.createObjectURL(blob);
          setCarouselUrl(localCarouselUrl);
        }
      }

      // Auto-save to history
      const pdfBase64 = localCarouselUrl
        ? await blobUrlToBase64(localCarouselUrl)
        : undefined;

      saveToHistory({
        title: form.title,
        tone: form.tone,
        language: form.language,
        length: form.length,
        text: formatted,
        pdfBase64,
      });
      refreshHistory();
      toast.success('Salvo no Histórico', { duration: 2000, icon: '🗂' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Algo deu errado: ${msg}`, { duration: 6000 });
      setAgentState({ writer: 'idle', reviewer: 'idle', formatter: 'idle' });
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

        {/* Tabs */}
        <div className="max-w-3xl mx-auto flex border-t border-gray-100">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative ${
              tab === 'create'
                ? 'text-linkedin-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✍️ Criar Post
            {tab === 'create' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkedin-blue rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
              tab === 'history'
                ? 'text-linkedin-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🗂 Histórico
            {history.length > 0 && (
              <span className="bg-linkedin-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {history.length}
              </span>
            )}
            {tab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkedin-blue rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {tab === 'history' ? (
          <PostHistory entries={history} onDelete={handleDelete} />
        ) : (
          <>
            {/* Intro */}
            {!isGenerating && !finalPost && (
              <div className="bg-gradient-to-r from-linkedin-blue to-linkedin-dark rounded-xl p-5 text-white">
                <h2 className="text-lg font-bold mb-1">Olá! Sua equipe IA está pronta 🤝</h2>
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
                  onRegenerate={lastForm ? () => generate(lastForm!) : undefined}
                />
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        My LinkedIn Team — Powered by Claude Opus 4.7
      </footer>
    </main>
  );
}
