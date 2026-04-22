'use client';

export interface AgentState {
  writer: 'idle' | 'working' | 'done';
  reviewer: 'idle' | 'working' | 'done';
  formatter: 'idle' | 'working' | 'done';
  writerContent?: string;
  reviewerContent?: string;
  formatterContent?: string;
}

const AGENTS = [
  {
    key: 'writer' as const,
    name: 'Redator',
    role: 'Cria o rascunho inicial do post',
    emoji: '✍️',
    workingMsg: 'Escrevendo e estruturando o conteúdo...',
    doneMsg: 'Rascunho criado!',
  },
  {
    key: 'reviewer' as const,
    name: 'Revisor',
    role: 'Revisa, aprimora e corrige',
    emoji: '🔍',
    workingMsg: 'Revisando gramática, tom e impacto...',
    doneMsg: 'Conteúdo revisado!',
  },
  {
    key: 'formatter' as const,
    name: 'Formatador',
    role: 'Formata para máximo engajamento',
    emoji: '✨',
    workingMsg: 'Formatando para LinkedIn...',
    doneMsg: 'Post formatado e pronto!',
  },
];

interface Props {
  state: AgentState;
}

export default function AgentProgress({ state }: Props) {
  const allDone = state.writer === 'done' && state.reviewer === 'done' && state.formatter === 'done';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                allDone ? 'bg-green-500' : 'bg-linkedin-blue animate-pulse'
              }`}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        <h2 className="text-sm font-semibold text-gray-900">
          {allDone ? 'Equipe concluiu o trabalho!' : 'Equipe trabalhando no seu post...'}
        </h2>
      </div>

      <div className="space-y-3">
        {AGENTS.map((agent, idx) => {
          const status = state[agent.key];
          const contentKey = `${agent.key}Content` as keyof AgentState;
          const content = state[contentKey] as string | undefined;

          const isDone = status === 'done';
          const isWorking = status === 'working';
          const isIdle = status === 'idle';

          return (
            <div
              key={agent.key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                isWorking
                  ? 'border-linkedin-blue/30 bg-linkedin-light shadow-sm'
                  : isDone
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Step number / status icon */}
              <div className="flex-shrink-0 relative">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                    isWorking
                      ? 'bg-linkedin-blue/10 ring-2 ring-linkedin-blue/30 ring-offset-2'
                      : isDone
                      ? 'bg-green-100'
                      : 'bg-gray-200'
                  }`}
                >
                  {isDone ? (
                    <span className="text-green-600 text-base">✓</span>
                  ) : (
                    <span>{agent.emoji}</span>
                  )}
                </div>
                {isWorking && (
                  <span className="absolute inset-0 rounded-full border-2 border-linkedin-blue animate-ping opacity-75" />
                )}
                {/* Step number badge */}
                <span
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isWorking
                      ? 'bg-linkedin-blue text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{agent.name}</span>
                  <span className="text-xs text-gray-400">{agent.role}</span>
                </div>

                {isWorking && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-linkedin-blue rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                    <p className="text-xs text-linkedin-blue font-medium">{agent.workingMsg}</p>
                  </div>
                )}

                {isDone && content && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate pr-4">
                    {content.slice(0, 100)}...
                  </p>
                )}

                {isIdle && (
                  <p className="text-xs text-gray-400 mt-0.5">Aguardando vez...</p>
                )}
              </div>

              {/* Badge */}
              <div className="flex-shrink-0">
                {isDone && (
                  <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {agent.doneMsg}
                  </span>
                )}
                {isWorking && (
                  <span className="text-xs text-linkedin-blue font-semibold bg-linkedin-blue/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Em ação
                  </span>
                )}
                {isIdle && (
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Na fila
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
