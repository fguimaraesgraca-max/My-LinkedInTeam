'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { HistoryEntry, getPdfBlobUrl } from '@/lib/history';

const TONE_LABELS: Record<string, string> = {
  executive: '💼 Executivo',
  friendly: '🤝 Amigável',
  inspiring: '🚀 Inspirador',
  educational: '📚 Educacional',
  celebratory: '🎉 Comemorativo',
};

const LANG_LABELS: Record<string, string> = {
  pt: '🇧🇷 PT',
  en: '🇺🇸 EN',
  'pt-en': '🌐 PT→EN',
  'en-pt': '🌐 EN→PT',
};

const LENGTH_LABELS: Record<string, string> = {
  concise: '⚡ Conciso',
  medium: '📝 Médio',
  long: '📖 Longo',
};

function HistoryCard({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete: () => void;
}) {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const triggerDelete = () => {
    setRemoving(true);
    setTimeout(onDelete, 220);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const delta = e.touches[0].clientX - startX;
    setOffsetX(Math.min(0, Math.max(-96, delta)));
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX < -64) {
      triggerDelete();
    } else {
      setOffsetX(0);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(entry.text);
      toast.success('Post copiado! Cole direto no LinkedIn.', { duration: 2500 });
    } catch {
      toast.error('Erro ao copiar. Selecione o texto manualmente.');
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      let url: string | undefined;

      if (entry.hasPdf) {
        url = await getPdfBlobUrl(entry.id);
      } else if (entry.pdfBase64) {
        url = entry.pdfBase64;
      }

      if (!url) {
        toast.error('PDF não encontrado. Pode ter sido apagado ao limpar o app.');
        return;
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-carousel-${entry.id}.pdf`;
      a.click();

      if (entry.hasPdf) URL.revokeObjectURL(url);
      toast.success('PDF baixado!', { duration: 2000 });
    } catch {
      toast.error('Erro ao baixar o PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const hasPdfDownload = entry.hasPdf || !!entry.pdfBase64;

  const dateStr = new Date(entry.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const preview = entry.text.replace(/\n+/g, ' ').slice(0, 130);

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        opacity: removing ? 0 : 1,
        maxHeight: removing ? 0 : '500px',
        marginBottom: removing ? 0 : undefined,
        transition: removing ? 'all 0.22s ease' : undefined,
      }}
    >
      {/* Delete background (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex flex-col items-center justify-center rounded-r-xl gap-1">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="text-white text-[11px] font-bold">Excluir</span>
      </div>

      {/* Swipeable card */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 mb-0.5">{dateStr}</p>
              <p className="text-sm font-bold text-gray-900 truncate">{entry.title}</p>
            </div>
            <button
              onClick={triggerDelete}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Excluir"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[TONE_LABELS[entry.tone], LANG_LABELS[entry.language], LENGTH_LABELS[entry.length]]
              .filter(Boolean)
              .map((label) => (
                <span key={label} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {label}
                </span>
              ))}
            {hasPdfDownload && (
              <span className="text-[10px] bg-blue-50 text-linkedin-blue px-2 py-0.5 rounded-full font-medium">
                📄 PDF
              </span>
            )}
          </div>

          {/* Text preview */}
          <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
            {preview}{entry.text.length > 130 ? '…' : ''}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={copyText}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-linkedin-blue hover:bg-linkedin-dark text-white rounded-lg text-xs font-bold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar Post
            </button>
            {hasPdfDownload && (
              <button
                onClick={downloadPdf}
                disabled={downloadingPdf}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-linkedin-blue text-linkedin-blue hover:bg-linkedin-light rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Baixar PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
}

export default function PostHistory({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-500">Nenhuma criação salva ainda</p>
        <p className="text-xs text-gray-400 mt-1">Seus posts aparecerão aqui após você salvar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 text-center">
        {entries.length} post{entries.length !== 1 ? 's' : ''} salvo{entries.length !== 1 ? 's' : ''} · Deslize para esquerda ou toque no lixo para excluir
      </p>
      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} />
      ))}
    </div>
  );
}
