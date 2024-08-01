'use client';

import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import { Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, content }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className={`language-${language} line-numbers rounded-lg p-4 overflow-x-auto bg-secondary text-secondary-foreground`}>
        <code className={`language-${language}`}>{content.trim()}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 bg-primary text-primary-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {copied ? 'Copied!' : <Copy size={16} />}
      </button>
    </div>
  );
};

export default CodeBlock;