'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  post: string;
  carouselUrl: string;
  imageCount: number;
  onRegenerate?: () => void;
}

export default function PostResult({ post, carouselUrl, imageCount, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  const charCount = post.length;
  const charPct = Math.min((charCount / 3000) * 100, 100);
  const charColor =
    charCount > 2700
      ? 'text-red-600'
      : charCount > 2000
      ? 'text-amber-600'
      : 'text-green-600';
  const barColor =
    charCount > 2700 ? 'bg-red-500' : charCount > 2000 ? 'bg-amber-400' : 'bg-green-500';

  const hookEnd = 230;
  const hookText = post.slice(0, hookEnd);
  const hasMore = post.length > hookEnd;

  const copyPost = async () => {
    try {
      await navigator.clipboard.writeText(post);
      setCopied(true);
      toast.success('Post copiado! Agora é só colar no LinkedIn 🚀', { duration: 3000 });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar. Selecione o texto e copie manualmente.');
    }
  };

  const downloadCarousel = () => {
    const a = document.createElement('a');
    a.href = carouselUrl;
    a.download = 'linkedin-carousel.pdf';
    a.click();
    toast.success('Carrossel PDF baixado! 📄 Publique diretamente no LinkedIn.');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
            ✓
          </span>
          <h2 className="text-sm font-bold text-gray-900">Post pronto para publicar!</h2>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-xs text-linkedin-blue hover:text-linkedin-dark flex items-center gap-1 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerar
          </button>
        )}
      </div>

      {/* LinkedIn Preview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Post author header */}
        <div className="px-4 pt-4 pb-2 flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-linkedin-blue to-linkedin-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            Eu
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Você</div>
            <div className="text-xs text-gray-500">Seu cargo • Sua empresa</div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <span>Agora</span>
              <span>·</span>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Hook preview */}
        <div className="px-4 pb-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                👁 Preview — aparece antes de "ver mais" (~230 chars)
              </span>
            </div>
            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
              {hookText}
              {hasMore && (
                <span className="text-linkedin-blue cursor-pointer ml-0.5">...ver mais</span>
              )}
            </p>
          </div>

          {/* Full post */}
          <div className="relative">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-100 scrollbar-thin">
              {post}
            </pre>
          </div>
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>👍 Curtir</span>
              <span>💬 Comentar</span>
              <span>↗ Compartilhar</span>
            </div>
            <span className={`text-xs font-bold ${charColor}`}>
              {charCount.toLocaleString('pt-BR')} / 3.000 caracteres
            </span>
          </div>

          {/* Char bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${charPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning */}
      {charCount > 3000 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-2 text-sm text-red-700">
          <span>⚠️</span>
          <span>
            O post excede o limite de 3.000 caracteres do LinkedIn. Considere{' '}
            <button onClick={onRegenerate} className="underline font-medium">
              regenerar
            </button>{' '}
            ou editar antes de publicar.
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={copyPost}
          className={`py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            copied
              ? 'bg-green-500 text-white shadow-green-200'
              : 'bg-linkedin-blue hover:bg-linkedin-dark text-white hover:shadow-md'
          }`}
        >
          {copied ? (
            <>✓ Copiado com sucesso!</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar Post para LinkedIn
            </>
          )}
        </button>

        {carouselUrl ? (
          <button
            onClick={downloadCarousel}
            className="py-3.5 bg-white border-2 border-linkedin-blue text-linkedin-blue hover:bg-linkedin-light rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Baixar Carrossel PDF ({imageCount} slide{imageCount !== 1 ? 's' : ''})
          </button>
        ) : (
          <div className="py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
              />
            </svg>
            Sem imagens — sem carrossel
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-linkedin-light border border-linkedin-blue/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-linkedin-blue mb-2">💡 Dicas para publicar</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Clique em "Copiar Post" e cole diretamente no campo de nova publicação do LinkedIn</li>
          {imageCount > 0 && (
            <li>• Baixe o PDF do carrossel e faça upload como documento no LinkedIn</li>
          )}
          <li>• Publique nos horários de maior alcance: terças a quintas, das 8h às 10h ou 17h às 19h</li>
          <li>• Interaja com os comentários nas primeiras horas para aumentar o alcance</li>
        </ul>
      </div>
    </div>
  );
}
