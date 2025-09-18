'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { useState } from 'react';

// Tokyo Night Storm theme
const tokyoNightStormTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1a1b26',
    color: '#c0caf5',
  },
  '.cm-content': {
    backgroundColor: '#1a1b26',
    color: '#c0caf5',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    backgroundColor: '#1a1b26',
  },
  '.cm-scroller': {
    backgroundColor: '#1a1b26',
  },
  '.cm-gutters': {
    backgroundColor: '#1a1b26',
    border: 'none',
  },
  '.cm-line': {
    color: '#c0caf5',
  },
  '.cm-cursor': {
    borderLeft: '1px solid #c0caf5',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#2d3748',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  // Syntax highlighting colors
  '.cm-keyword': { color: '#bb9af7' },
  '.cm-string': { color: '#9ece6a' },
  '.cm-number': { color: '#ff9e64' },
  '.cm-comment': { color: '#565f89', fontStyle: 'italic' },
  '.cm-variable': { color: '#a9b1d6' },
  '.cm-function': { color: '#7aa2f7' },
  '.cm-property': { color: '#9ece6a' },
  '.cm-operator': { color: '#7aa2f7' },
  '.cm-tag': { color: '#f7768e' },
  '.cm-attribute': { color: '#e0af68' },
  '.cm-builtin': { color: '#bb9af7' },
  '.cm-type': { color: '#e0af68' },
  '.cm-atom': { color: '#bb9af7' },
  '.cm-def': { color: '#7aa2f7' },
  '.cm-meta': { color: '#565f89' },
  '.cm-qualifier': { color: '#e0af68' },
  '.cm-variable-2': { color: '#a9b1d6' },
  '.cm-variable-3': { color: '#a9b1d6' },
  '.cm-bracket': { color: '#a9b1d6' },
  '.cm-punctuation': { color: '#a9b1d6' },
}, { dark: true });

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors z-10"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

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

              const codeText = String(children).replace(/\n$/, '');
              
              return (
                <div className="relative my-4 rounded-lg border border-gray-700 dark:border-gray-600 overflow-hidden group">
                  <CopyButton text={codeText} />
                  <CodeMirror
                    value={codeText}
                    extensions={[getLanguageExtension(language), tokyoNightStormTheme]}
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