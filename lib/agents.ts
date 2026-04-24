import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-opus-4-7';

export type Tone = 'executive' | 'friendly' | 'inspiring' | 'educational' | 'celebratory';
export type Language = 'pt' | 'en' | 'pt-en' | 'en-pt';
export type Length = 'concise' | 'medium' | 'long';

export interface AgentInput {
  title: string;
  description: string;
  link?: string;
  tone: Tone;
  language: Language;
  length: Length;
  audience: string;
  imageCount?: number;
}

const TONE_MAP: Record<Tone, string> = {
  executive: 'executivo e estratégico, com autoridade e visão de liderança, focado em resultados e impacto de negócio',
  friendly: 'amigável e pessoal, como uma conversa autêntica entre profissionais, caloroso, acessível e genuíno',
  inspiring: 'inspirador e motivacional, que engaja emocionalmente e motiva a audiência a agir ou refletir profundamente',
  educational: 'educativo e informativo, compartilhando conhecimento valioso, insights práticos e aprendizados acionáveis',
  celebratory: 'comemorativo e entusiasmado, celebrando conquistas e marcos com energia positiva, gratidão e orgulho',
};

const LANG_MAP: Record<Language, string> = {
  pt: 'Escreva SOMENTE em português brasileiro. Todo o conteúdo, hashtags e call-to-action devem estar em português.',
  en: 'Write ONLY in English. All content, hashtags and call-to-action must be in English.',
  'pt-en': `Escreva em AMBOS os idiomas nesta estrutura EXATA:
[Post completo em Português incluindo hashtags]
——
[Post completo em English incluindo hashtags]`,
  'en-pt': `Write in BOTH languages following this EXACT structure:
[Complete post in English including hashtags]
——
[Post completo em Português incluindo hashtags]`,
};

const LENGTH_MAP: Record<Length, { single: string; bilingual: string; maxChars: number }> = {
  concise: {
    single: 'TAMANHO: post CONCISO, máximo 800 caracteres no total. Seja direto, impactante e objetivo. Vá direto ao ponto sem enrolação.',
    bilingual: 'TAMANHO: post CONCISO bilíngue, máximo 800 caracteres no total — cada versão com no máximo 380 caracteres. Seja extremamente direto.',
    maxChars: 800,
  },
  medium: {
    single: 'TAMANHO: post de tamanho MÉDIO, entre 1.000 e 1.800 caracteres. Equilibre profundidade e concisão.',
    bilingual: 'TAMANHO: post MÉDIO bilíngue, entre 1.000 e 1.800 caracteres no total — cada versão com no máximo 870 caracteres.',
    maxChars: 1800,
  },
  long: {
    single: 'TAMANHO: post LONGO e detalhado, entre 2.000 e 3.000 caracteres. Explore a narrativa com profundidade, storytelling rico e detalhes relevantes.',
    bilingual: 'TAMANHO: post LONGO bilíngue, entre 2.000 e 3.000 caracteres no total — cada versão com no máximo 1.400 caracteres.',
    maxChars: 3000,
  },
};

const WRITER_SYSTEM = `Você é um redator especialista em LinkedIn com profundo conhecimento em marketing pessoal e comunicação executiva. Você cria posts autênticos, engajadores e profissionais que constroem autoridade, conexão genuína e impulsionam o engajamento.

ESTRUTURA DO POST:
1. HOOK poderoso (primeiras 2-3 linhas): Impactante e irresistível — esta parte aparece antes do "ver mais" no LinkedIn. Precisa capturar atenção imediatamente.
2. DESENVOLVIMENTO: Conta a história ou insight de forma envolvente, pessoal e rica em detalhes relevantes.
3. LIÇÃO/VALOR: O que a audiência ganha ao ler este post — insight, perspectiva, aprendizado.
4. CALL-TO-ACTION: Pergunta ou convite claro e específico à interação da audiência.
5. HASHTAGS: 5-8 hashtags relevantes e estratégicas na última linha.

REGRAS ESSENCIAIS:
- NÃO use markdown (**negrito**, *itálico*, #headers) — o LinkedIn não renderiza formatação markdown
- Parágrafos curtos (máx 3 linhas cada) para boa leitura em dispositivos mobile
- Emojis: use com moderação e intenção (2-5 no total), apenas onde agregam valor visual ou emocional
- LIMITE ABSOLUTO: o post completo não pode ultrapassar 3.000 caracteres — esse é o limite do LinkedIn
- Posts em UM idioma: máximo 3.000 caracteres no total (texto + hashtags)
- Posts BILÍNGUES (com separador ——): as DUAS versões somadas + separador devem ter no máximo 3.000 caracteres; escreva cada versão com no máximo 1.400 caracteres
- Tom autêntico e humano — evite linguagem genérica ou claramente artificial
- NÃO inicie com "Olá" ou saudações genéricas`;

const REVIEWER_SYSTEM = `Você é um revisor sênior com expertise em comunicação executiva para LinkedIn, fluente em português e inglês, especialista em escrita persuasiva e storytelling profissional.

CHECKLIST COMPLETO DE REVISÃO:
1. GRAMÁTICA E ORTOGRAFIA: Corrija TODOS os erros sem exceção
2. FLUÊNCIA E NATURALIDADE: Elimine frases artificiais, jargões desnecessários ou linguagem claramente "gerada por IA"
3. HOOK: As primeiras 2-3 linhas são críticas — devem ser irresistíveis. Melhore se necessário.
4. TOM E CONSISTÊNCIA: Verifique que o tom está correto e consistente ao longo de todo o post
5. AUTENTICIDADE: O texto deve soar como escrito por um humano real com experiência genuína
6. IMPACTO: Fortaleça passagens fracas, elimine redundâncias, intensifique os momentos-chave
7. CALL-TO-ACTION: Deve ser específico, claro e convidar genuinamente à interação
8. HASHTAGS: Verifique relevância, popularidade e estratégia das hashtags escolhidas
9. COMPRIMENTO E LIMITE: O post completo DEVE ter no máximo 3.000 caracteres (limite do LinkedIn). Para posts bilíngues, cada versão deve ter no máximo 1.400 caracteres — corte o que não agrega valor real para respeitar esse limite.
10. ESTRUTURA VISUAL: Verifique espaçamento e organização para boa leitura

REGRAS:
- NÃO use markdown
- Se bilíngue (com separador ——), revise AMBAS as versões com igual cuidado e profundidade
- Se o post ultrapassar 3.000 caracteres, corte sem hesitar — o limite é inegociável
- Retorne APENAS o post revisado e melhorado, sem comentários ou explicações sobre as mudanças`;

const FORMATTER_SYSTEM = `Você é um especialista em formatação de conteúdo para LinkedIn com profundo conhecimento do algoritmo da plataforma, psicologia de leitura digital e melhores práticas de engajamento.

REGRAS DE FORMATAÇÃO PARA MÁXIMO ENGAJAMENTO:
1. HOOK PERFEITO: Os primeiros 200-250 caracteres aparecem antes de "ver mais". DEVEM ser impossíveis de ignorar.
2. ESPAÇAMENTO ESTRATÉGICO: Uma linha em branco entre cada parágrafo para respiração visual
3. PARÁGRAFOS CURTOS: Máximo 3 linhas por parágrafo — essencial para leitura em mobile
4. EMOJIS COM PROPÓSITO: Máximo 5, posicionados para guiar o olhar e criar ritmo visual
5. HASHTAGS NA ÚLTIMA LINHA: Separadas por espaço, sem vírgula entre elas, sem linha em branco antes
6. SEPARADOR BILÍNGUE: Se bilíngue, use EXATAMENTE "——" em linha própria para separar versões
7. SEM MARKDOWN: Absolutamente nenhum **, __, ##, ou qualquer formatação markdown
8. CTA CLARO: A chamada para ação deve ser a penúltima seção, logo antes das hashtags

OTIMIZAÇÕES FINAIS:
- LIMITE OBRIGATÓRIO: o post completo deve ter no máximo 3.000 caracteres — conte todos os caracteres incluindo espaços, emojis e o separador —— em posts bilíngues
- Para posts bilíngues: cada versão deve ter no máximo 1.400 caracteres; se necessário, corte partes menos relevantes de ambas as versões proporcionalmente
- Se o post ultrapassar 3.000 caracteres, corte o suficiente para ficar abaixo do limite — sem exceções
- Confirme que o hook é realmente impactante e não genérico
- Certifique-se que o espaçamento está correto e consistente
- Valide que as hashtags estão todas na última linha

Retorne APENAS o post formatado e otimizado, pronto para colar diretamente no LinkedIn.`;

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

export async function runWriterAgent(input: AgentInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: WRITER_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Crie um post completo e envolvente para LinkedIn com base nestas informações:

EVENTO / SITUAÇÃO: ${input.title}

CONTEXTO E DETALHES: ${input.description}
${input.link ? `\nLINK DE REFERÊNCIA: ${input.link}` : ''}
${input.imageCount && input.imageCount > 0 ? `\nIMAGENS: ${input.imageCount} imagem(ns) serão incluídas como carrossel no LinkedIn` : ''}

TOM DESEJADO: ${TONE_MAP[input.tone]}

IDIOMA: ${LANG_MAP[input.language]}

${(['pt-en', 'en-pt'] as Language[]).includes(input.language) ? LENGTH_MAP[input.length].bilingual : LENGTH_MAP[input.length].single}

AUDIÊNCIA ALVO: ${input.audience}

Crie um post que capture a essência desta experiência e ressoe profundamente com a audiência especificada.`,
      },
    ],
  });

  return extractText(response.content);
}

export async function runReviewerAgent(draft: string, input: AgentInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: `${REVIEWER_SYSTEM}

CONTEXTO DESTA REVISÃO:
- Audiência alvo: ${input.audience}
- Tom desejado: ${TONE_MAP[input.tone]}
- Configuração de idioma: ${LANG_MAP[input.language]}
- ${(['pt-en', 'en-pt'] as Language[]).includes(input.language) ? LENGTH_MAP[input.length].bilingual : LENGTH_MAP[input.length].single}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Revise e aprimore substancialmente este post de LinkedIn:\n\n${draft}`,
      },
    ],
  });

  return extractText(response.content);
}

export async function runFormatterAgent(reviewed: string, input: AgentInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: FORMATTER_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Faça a formatação final deste post para LinkedIn, otimizando para máximo engajamento e impacto visual.

${(['pt-en', 'en-pt'] as Language[]).includes(input.language) ? LENGTH_MAP[input.length].bilingual : LENGTH_MAP[input.length].single}

Post para formatar:\n\n${reviewed}`,
      },
    ],
  });

  const text = extractText(response.content);
  const limit = LENGTH_MAP[input.length].maxChars;
  if (text.length <= limit) return text;

  // Safety net: truncate at last complete line within the target limit
  const truncated = text.slice(0, limit);
  const lastNewline = truncated.lastIndexOf('\n');
  return lastNewline > limit * 0.85 ? truncated.slice(0, lastNewline).trimEnd() : truncated.trimEnd();
}
