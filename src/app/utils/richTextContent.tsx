import React from 'react';

interface RichTextContentProps {
  content: any; // Could be string or Drupal field object
  className?: string;
}

export function RichTextContent({
  content,
  className = '',
}: RichTextContentProps) {
  // Extract HTML content from various formats
  const getHtmlContent = (contentData: any): string => {
    if (!contentData) return '';

    if (typeof contentData === 'string') {
      return contentData;
    }

    if (contentData.processed) {
      return contentData.processed;
    }

    if (contentData.value) {
      return contentData.value;
    }

    return '';
  };

  // Basic sanitization
  const sanitizeHtml = (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/g, '');
  };

  const htmlContent = sanitizeHtml(getHtmlContent(content));

  if (!htmlContent) {
    return null;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
