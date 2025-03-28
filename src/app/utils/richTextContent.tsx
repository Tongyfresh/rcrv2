import React from 'react';
import * as cheerio from 'cheerio';

interface RichTextContentProps {
  content: any; // Could be string or Drupal field object
  className?: string;
}

/**
 * Pre-processes HTML content to enhance it before rendering
 */
export function enhanceRichText(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html);

  // Add target="_blank" to external links
  $('a[href^="http"]')
    .attr('target', '_blank')
    .attr('rel', 'noopener noreferrer');

  // Add custom classes to elements
  $('h2').addClass('text-primary text-2xl font-bold mb-4');
  $('h3').addClass('text-primary-dark text-xl font-semibold mb-3');
  $('ul').addClass('list-disc pl-5 mb-4');
  $('ol').addClass('list-decimal pl-5 mb-4');

  // Wrap tables for responsive behavior
  $('table').wrap('<div class="overflow-x-auto mb-4"></div>');

  return $.html();
}

export function RichTextContent({
  content,
  className = '',
}: RichTextContentProps) {
  const enhancedContent = enhanceRichText(content);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: enhancedContent }}
    />
  );
}
