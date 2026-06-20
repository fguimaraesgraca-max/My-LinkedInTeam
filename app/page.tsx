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

async function callAgent(endpoint: string, body: object) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `${endpoint} falhou (${res.status})`);
  }
  return res.json();
}

export default function Home() {
  const [tab, setTab] = useState<'create' | 'history'>('create');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [agentState, setAgentState] = useState<AgentState>({
    writer: 'idle',
    reviewer: 'idle',
    formatter: 'idle',
  });
  const [post1, setPost1] = useState('');
  const [post2, setPost2] = useState('');
  const [selectedOption, setSelectedOption] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [carouselUrl, setCarouselUrl] = useState('');
  const [lastForm, setLastForm] = useState<FormValues | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const refreshHistory = () => setHistory(loadHistory());

  const handleDelete = (id: string) => {
    removeFromHistory(id);
    refreshHistory();
  };

  const generate = async (form: FormValues) => {
    setIsGenerating(true);
    setPost1('');
    setPost2('');
    setCarouselUrl('');
    setImages(form.images);
    setLastForm(form);
    setSelectedOption(1);
    setAgentState({ writer: 'idle', reviewer: 'idle', formatter: 'idle' });

    const base = {
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
      // Writers — both in parallel
      setAgentState((prev) => ({ ...prev, writer: 'working' }));
      const [w1, w2] = await Promise.all([
        callAgent('/api/agent/write', base),
        callAgent('/api/agent/write', { ...base, variant: 'alternative' }),
      ]);
      setAgentState((prev) => ({ ...prev, writer: 'done', writerContent: w1.draft }));

      // Reviewers — both in parallel
      setAgentState((prev) => ({ ...prev, reviewer: 'working' }));
      const [r1, r2] = await Promise.all([
        callAgent('/api/agent/review', { ...base, draft: w1.draft }),
        callAgent('/api/agent/review', { ...base, draft: w2.draft }),
      ]);
      setAgentState((prev) => ({ ...prev, reviewer: 'done', reviewerContent: r1.reviewed }));

      // Formatters — both in parallel
      setAgentState((prev) => ({ ...prev, formatter: 'working' }));
      const [f1, f2] = await Promise.all([
        callAgent('/api/agent/format', { ...base, reviewed: r1.reviewed }),
        callAgent('/api/agent/format', { ...base, reviewed: r2.reviewed }),
      ]);
      setAgentState((prev) => ({ ...prev, formatter: 'done', formatterContent: f1.formatted }));

      setPost1(f1.formatted);
      setPost2(f2.formatted);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);

      // Carousel PDF — generated client-side (no server request, no size limits)
      let localCarouselUrl = '';
      if (form.images.length > 0 && form.generateCarousel) {
        try {
          const { generateCarouselPdf } = await import('@/lib/generateCarouselPdf');
          localCarouselUrl = await generateCarouselPdf(form.images);
          setCarouselUrl(localCarouselUrl);
        } catch (carouselErr) {
          toast.error(
            `Erro ao gerar PDF: ${carouselErr instanceof Error ? carouselErr.message : 'desconhecido'}`,
            { duration: 6000 }
          );
        }
      }

      // Save both options to history (PDF only on option 1 to avoid duplicate storage)
      const pdfBase64 = localCarouselUrl ? await blobUrlToBase64(localCarouselUrl) : undefined;
      saveToHistory({ title: `${form.title} — Opção 1`, tone: form.tone, language: form.language, length: form.length, text: f1.formatted, pdfBase64 });
      saveToHistory({ title: `${form.title} — Opção 2`, tone: form.tone, language: form.language, length: form.length, text: f2.formatted });
      refreshHistory();
      toast.success('2 opções salvas no Histórico', { duration: 2500, icon: '🗂' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Algo deu errado: ${msg}`, { duration: 6000 });
      setAgentState({ writer: 'idle', reviewer: 'idle', formatter: 'idle' });
    } finally {
      setIsGenerating(false);
    }
  };

  const activePost = selectedOption === 1 ? post1 : post2;

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
          {(['create', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
                tab === t ? 'text-linkedin-blue' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'create' ? '✍️ Criar Post' : '🗂 Histórico'}
              {t === 'history' && history.length > 0 && (
                <span className="bg-linkedin-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {history.length}
                </span>
              )}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linkedin-blue rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {tab === 'history' ? (
          <PostHistory entries={history} onDelete={handleDelete} />
        ) : (
          <>
            {/* Intro banner */}
            {!isGenerating && !post1 && (
              <div className="bg-gradient-to-r from-linkedin-blue to-linkedin-dark rounded-xl p-5 text-white">
                <h2 className="text-lg font-bold mb-1">Olá! Sua equipe IA está pronta 🤝</h2>
                <p className="text-sm text-white/85 leading-relaxed">
                  Preencha as informações abaixo. Sua equipe criará{' '}
                  <span className="font-bold underline decoration-white/50">2 opções de post</span>{' '}
                  em paralelo para você escolher a melhor.
                </p>
                <div className="flex gap-3 mt-3">
                  {['✍️ Redator', '🔍 Revisor', '✨ Formatador'].map((a) => (
                    <span key={a} className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <PostForm onGenerate={generate} isGenerating={isGenerating} />

            {(isGenerating || agentState.writer !== 'idle' || post1) && (
              <AgentProgress state={agentState} dual />
            )}

            {(post1 || post2) && (
              <div ref={resultRef} className="space-y-4">
                {/* Option selector */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
                  {([1, 2] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`flex-1 py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        selectedOption === opt
                          ? 'bg-linkedin-blue text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {selectedOption === opt && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Opção {opt}
                      {opt === 2 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          selectedOption === 2 ? 'bg-white/20 text-white' : 'bg-linkedin-light text-linkedin-blue'
                        }`}>
                          alternativa
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <PostResult
                  post={activePost}
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
