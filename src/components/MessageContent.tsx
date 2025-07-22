"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isTyping?: boolean;
  typingContent?: string;
  className?: string;
}

export default function MessageContent({ 
  content, 
  isTyping = false, 
  typingContent = "", 
  className = "" 
}: MessageContentProps) {
  const displayContent = isTyping ? typingContent : content;

  // For typing animation, we need to render content + cursor inline to prevent cursor jumping to new line
  if (isTyping) {
    return (
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // During typing, make paragraphs inline to keep cursor on same line
            p: ({ children }) => <span className="leading-relaxed">{children}</span>,
            
            // Style headings
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
            
            // Style lists
            ul: ({ children }) => <ul className="list-none space-y-1 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-4">{children}</ol>,
            li: ({ children }) => <li className="flex items-start"><span className="text-gray-600 mr-2">•</span><span className="flex-1">{children}</span></li>,
            
            // Style emphasis
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
            
            // Style code
            code: ({ children, className }) => {
              const isInline = !className?.includes('language-');
              if (isInline) {
                return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>;
              }
              return <code className="block bg-gray-100 p-2 rounded text-sm font-mono text-gray-800 whitespace-pre-wrap">{children}</code>;
            },
            
            // Style links
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            ),
            
            // Style blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 my-2 text-gray-700 italic">
                {children}
              </blockquote>
            ),
          }}
        >
          {displayContent}
        </ReactMarkdown>
        {/* Add typing cursor inline */}
        <span className="animate-pulse ml-1 text-blue-600 font-bold">|</span>
      </div>
    );
  }

  // For completed messages, use proper block-level elements
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style headings
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
          
          // Style lists - this is the key fix for your bullet points!
          ul: ({ children }) => <ul className="list-none space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-4">{children}</ol>,
          li: ({ children }) => <li className="flex items-start"><span className="text-gray-600 mr-2">•</span><span className="flex-1">{children}</span></li>,
          
          // Style paragraphs
          p: ({ children }) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
          
          // Style emphasis
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
          
          // Style code
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            if (isInline) {
              return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>;
            }
            return <code className="block bg-gray-100 p-2 rounded text-sm font-mono text-gray-800 whitespace-pre-wrap">{children}</code>;
          },
          
          // Style links
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 text-gray-700 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}