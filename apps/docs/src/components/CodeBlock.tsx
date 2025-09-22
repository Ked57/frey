"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export default function CodeBlock({ children, className }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  if (!language) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <SyntaxHighlighter
      style={tomorrow}
      language={language}
      PreTag="div"
      className="rounded-lg border border-gray-700 dark:border-gray-600"
      customStyle={{
        margin: "1rem 0",
        fontSize: "0.875rem",
        lineHeight: "1.5",
      }}
    >
      {children}
    </SyntaxHighlighter>
  );
}
