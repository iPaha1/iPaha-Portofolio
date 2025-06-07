import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, Copy, CheckCircle } from 'lucide-react';
 

// Table of Contents Component
interface TableOfContentsProps {
  content: string;
}

const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [activeSection, setActiveSection] = useState('');
  const [tocItems, setTocItems] = useState<{ level: number; text: string; id: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Extract headings from content
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, ''); // Remove HTML tags
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      headings.push({
        level,
        text,
        id,
      });
    }

    setTocItems(headings);
  }, [content]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    });
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="sticky top-8">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <nav className="space-y-2">
            {tocItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left text-sm p-2 rounded transition-colors ${
                    item.level === 2 ? 'pl-2' : 'pl-6'
                  } ${
                    activeSection === item.id
                      ? 'bg-amber-50 text-amber-700 border-l-2 border-amber-500'
                      : 'text-gray-600 hover:text-amber-600 hover:bg-gray-50'
                  }`}
                  aria-label={`Go to section: ${item.text}`}
                >
                  {item.text}
                </button>
                <button
                  onClick={() => copyToClipboard(item.id)}
                  className="ml-2 p-1 text-gray-600 hover:text-amber-600"
                  aria-label={`Copy link to ${item.text}`}
                >
                  {copiedId === item.id ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
};

export default TableOfContents;