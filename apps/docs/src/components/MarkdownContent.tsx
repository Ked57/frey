"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { tokyoNightStorm } from "@uiw/codemirror-theme-tokyo-night-storm";
import { EditorView } from "@codemirror/view";
import { useState } from "react";

// Custom theme extension to add padding and fix async keyword color
const tokyoNightStormWithPadding = EditorView.theme(
  {
    ".cm-content": {
      padding: "1rem",
    },
    // Force all keywords to be purple, including async
    ".cm-keyword": {
      color: "#bb9af7 !important",
    },
    ".cm-token.cm-keyword": {
      color: "#bb9af7 !important",
    },
    // Target specific token types that might be used for async
    '.cm-token[data-token="async"]': {
      color: "#bb9af7 !important",
    },
    '.cm-token[data-token="await"]': {
      color: "#bb9af7 !important",
    },
  },
  { dark: true },
);

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors z-10 border border-gray-600"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? "✓ Copied" : "Copy"}
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
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            if (language) {
              // Map language names to CodeMirror extensions
              const getLanguageExtension = (lang: string) => {
                switch (lang) {
                  case "javascript":
                  case "js":
                    return javascript();
                  case "typescript":
                  case "ts":
                    return javascript();
                  case "json":
                    return json();
                  case "markdown":
                  case "md":
                    return markdown();
                  case "bash":
                  case "shell":
                  case "sh":
                    return javascript(); // Use JavaScript highlighting for shell commands
                  default:
                    return javascript(); // fallback
                }
              };

              const codeText = String(children).replace(/\n$/, "");

              return (
                <div className="relative my-4 rounded-lg border border-gray-700 dark:border-gray-600 overflow-hidden group">
                  <CopyButton text={codeText} />
                  <CodeMirror
                    value={codeText}
                    extensions={[
                      getLanguageExtension(language),
                      tokyoNightStormWithPadding,
                    ]}
                    theme={tokyoNightStorm}
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
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
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
