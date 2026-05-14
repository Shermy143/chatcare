import { Bot, User } from 'lucide-react';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  avatarUrl?: string;
}

// Burbuja de mensaje para el chat
export default function Message({ role, content, avatarUrl }: Props) {
  const isBot = role === 'assistant';

  return (
    <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isBot ? '' : 'self-end flex-row-reverse'}`}>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 overflow-hidden
        ${isBot ? 'bg-primary text-on-primary' : 'border border-outline-variant'}`}>
        {isBot
          ? <Bot className="w-5 h-5" />
          : avatarUrl
            ? <img src={avatarUrl} alt="Paciente" className="w-full h-full object-cover" />
            : <User className="w-5 h-5 text-on-surface-variant" />
        }
      </div>

      {/* Burbuja */}
      <div className={`p-3.5 md:p-4 rounded-2xl shadow-sm text-sm md:text-base whitespace-pre-wrap
        ${isBot
          ? 'bg-surface border border-outline-variant text-on-surface rounded-tl-sm'
          : 'bg-primary text-on-primary rounded-tr-sm'
        }`}>
        {content}
      </div>
    </div>
  );
}
