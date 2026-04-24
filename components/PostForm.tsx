'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export type Tone = 'executive' | 'friendly' | 'inspiring' | 'educational' | 'celebratory';
export type Language = 'pt' | 'en' | 'pt-en' | 'en-pt';
export type Length = 'concise' | 'medium' | 'long';

export interface FormValues {
  title: string;
  description: string;
  link: string;
  tone: Tone;
  language: Language;
  length: Length;
  audience: string;
  images: File[];
}

interface Props {
  onGenerate: (values: FormValues) => void;
  isGenerating: boolean;
}

const TONES: { value: Tone; label: string; emoji: string; desc: string }[] = [
  { value: 'executive', label: 'Executivo', emoji: '💼', desc: 'Estratégico' },
  { value: 'friendly', label: 'Amigável', emoji: '🤝', desc: 'Pessoal' },
  { value: 'inspiring', label: 'Inspirador', emoji: '🚀', desc: 'Motivacional' },
  { value: 'educational', label: 'Educacional', emoji: '📚', desc: 'Informativo' },
  { value: 'celebratory', label: 'Comemorativo', emoji: '🎉', desc: 'Celebrativo' },
];

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt-en', label: 'PT → EN', flag: '🌐' },
  { value: 'en-pt', label: 'EN → PT', flag: '🌐' },
];

const LENGTHS: { value: Length; label: string; emoji: string; desc: string; chars: string }[] = [
  { value: 'concise', label: 'Conciso', emoji: '⚡', desc: 'Direto ao ponto', chars: '~800 chars' },
  { value: 'medium', label: 'Médio', emoji: '📝', desc: 'Equilibrado', chars: '~1.500 chars' },
  { value: 'long', label: 'Longo', emoji: '📖', desc: 'Detalhado', chars: '~2.500 chars' },
];

const AUDIENCE_SUGGESTIONS = [
  'CTOs e líderes de tecnologia',
  'Profissionais de RH e gestão de pessoas',
  'Empreendedores e fundadores de startups',
  'Executivos C-level e diretores',
  'Profissionais de marketing digital',
  'Investidores e venture capital',
  'Gestores e líderes de equipe',
  'Profissionais de vendas e negócios',
];

export default function PostForm({ onGenerate, isGenerating }: Props) {
  const [values, setValues] = useState<FormValues>({
    title: '',
    description: '',
    link: '',
    tone: 'executive',
    language: 'pt',
    length: 'medium',
    audience: '',
    images: [],
  });

  const onDrop = useCallback((accepted: File[]) => {
    setValues((v) => ({ ...v, images: [...v.images, ...accepted].slice(0, 20) }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    multiple: true,
  });

  const removeImage = (i: number) =>
    setValues((v) => ({ ...v, images: v.images.filter((_, idx) => idx !== i) }));

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim() || !values.description.trim() || !values.audience.trim()) return;
    onGenerate(values);
  };

  const isValid = values.title.trim() && values.description.trim() && values.audience.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section 1: Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-linkedin-blue text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            1
          </span>
          Sobre o Conteúdo
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título / Evento / Situação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Palestra no Web Summit, nova certificação, promoção, projeto entregue..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-linkedin-blue/30 focus:border-linkedin-blue transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição e Contexto <span className="text-red-500">*</span>
            </label>
            <textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descreva com detalhes: o que aconteceu, sua experiência, pontos principais, aprendizados, emoções, quem estava envolvido, números/resultados relevantes..."
              rows={5}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-linkedin-blue/30 focus:border-linkedin-blue resize-none transition-colors"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Quanto mais detalhes você fornecer, melhor será o post gerado.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link de referência{' '}
              <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </label>
            <input
              type="url"
              value={values.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://... artigo, vídeo, site do evento, portfólio..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-linkedin-blue/30 focus:border-linkedin-blue transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-linkedin-blue text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            2
          </span>
          Configurações do Post
        </h2>

        <div className="space-y-5">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tom da Comunicação</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('tone', t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all flex-shrink-0 min-w-[80px] ${
                    values.tone === t.value
                      ? 'border-linkedin-blue bg-linkedin-light shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-xs font-semibold text-gray-800 leading-tight whitespace-nowrap">{t.label}</span>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => set('language', l.value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    values.language === l.value
                      ? 'border-linkedin-blue bg-linkedin-light text-linkedin-blue shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
            {(values.language === 'pt-en' || values.language === 'en-pt') && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <span>ℹ️</span>
                O post será gerado nos dois idiomas separados por "——"
              </p>
            )}
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho do Post</label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => set('length', l.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                    values.length === l.value
                      ? 'border-linkedin-blue bg-linkedin-light shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{l.emoji}</span>
                  <span className="text-xs font-semibold text-gray-800">{l.label}</span>
                  <span className="text-[10px] text-gray-500">{l.chars}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audiência Alvo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.audience}
              onChange={(e) => set('audience', e.target.value)}
              placeholder="Para quem é este conteúdo? Ex: CTOs e líderes de tecnologia"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-linkedin-blue/30 focus:border-linkedin-blue transition-colors"
              list="audience-suggestions"
              required
            />
            <datalist id="audience-suggestions">
              {AUDIENCE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <p className="text-xs text-gray-400 mt-1">
              Defina claramente quem você quer atingir para personalizar o conteúdo.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Media */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-linkedin-blue text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
            3
          </span>
          Imagens para Carrossel
          <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4 ml-8">
          Faça upload das fotos do evento ou situação. Geraremos um PDF de carrossel pronto para
          publicar no LinkedIn.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-linkedin-blue bg-linkedin-light'
              : 'border-gray-300 hover:border-linkedin-blue/50 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            {isDragActive ? (
              <p className="text-sm font-medium text-linkedin-blue">Solte as imagens aqui!</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-linkedin-blue">Clique para selecionar</span> ou
                  arraste as imagens
                </p>
                <p className="text-xs text-gray-400">JPEG e PNG — até 20 imagens</p>
              </>
            )}
          </div>
        </div>

        {values.images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">
                {values.images.length} {values.images.length === 1 ? 'imagem' : 'imagens'}{' '}
                selecionada{values.images.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => set('images', [])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remover todas
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {values.images.map((img, i) => (
                <div key={i} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Slide ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded font-medium">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isGenerating || !isValid}
        className="w-full py-4 bg-linkedin-blue hover:bg-linkedin-dark text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base shadow-sm hover:shadow-md"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Criando seu post... (pode levar até 2 min)
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Criar Post com Minha Equipe IA
          </>
        )}
      </button>
    </form>
  );
}
