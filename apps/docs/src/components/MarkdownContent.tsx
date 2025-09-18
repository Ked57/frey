'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Custom Tokyo Night Storm theme based on vscDarkPlus
const tokyoNightStormTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    backgroundColor: '#1a1b26', // Tokyo Night Storm background
    color: '#c0caf5', // Lighter text for better contrast
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    backgroundColor: '#1a1b26', // Tokyo Night Storm background
    color: '#c0caf5', // Lighter text for better contrast
  },
};


interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (language) {
              return (
                <SyntaxHighlighter
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  style={tokyoNightStormTheme as any}
                  language={language}
                  PreTag="div"
                  className="rounded-lg border border-gray-700 dark:border-gray-600"
                  customStyle={{
                    margin: '1rem 0',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }

            return (
              <code
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <div>{children}</div>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}