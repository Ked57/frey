'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';


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
              // Map language names to CodeMirror extensions
              const getLanguageExtension = (lang: string) => {
                switch (lang) {
                  case 'javascript':
                  case 'js':
                    return javascript();
                  case 'typescript':
                  case 'ts':
                    return javascript();
                  case 'json':
                    return json();
                  case 'markdown':
                  case 'md':
                    return markdown();
                  default:
                    return javascript(); // fallback
                }
              };

              return (
                <div className="my-4 rounded-lg border border-gray-700 dark:border-gray-600 overflow-hidden">
                  <CodeMirror
                    value={String(children).replace(/\n$/, '')}
                    extensions={[getLanguageExtension(language)]}
                    theme={oneDark}
                    editable={false}
                    basicSetup={{
                      lineNumbers: false,
                      foldGutter: false,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: false,
                      bracketMatching: false,
                      closeBrackets: false,
                      autocompletion: false,
                      highlightSelectionMatches: false,
                    }}
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                    }}
                  />
                </div>
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