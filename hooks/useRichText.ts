import { useMemo } from 'react';
import { RichTextContent } from '@/app/utils/richTextContent';

/**
 * Hook for processing rich text content from Drupal
 * @param content The HTML content from Drupal
 */
export function useRichTextContent(content: string | null | undefined) {
  // Process the content only when it changes
  return useMemo(() => {
    if (!content) return null;
    return <RichTextContent html={content} />;
  }, [content]);
}