import * as cheerio from 'cheerio';

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  const $ = cheerio.load(html);

  // Remove potentially dangerous elements
  $('script, iframe, object, embed, form, style, link, meta').remove();

  // Remove event handlers
  $('*').each((_, el) => {
    // Skip non-element nodes
    if (el.type !== 'tag' && el.type !== 'script' && el.type !== 'style')
      return;

    // Type assertion using unknown as an intermediate step (safer than direct any)
    const element = el as unknown as { attribs?: Record<string, string> };
    const attributes = element.attribs;
    if (!attributes) return;

    Object.keys(attributes).forEach((attr) => {
      if (attr.startsWith('on')) {
        $(el).removeAttr(attr);
      }
    });

    // Clean up src/href attributes
    if (
      attributes.href &&
      (attributes.href.startsWith('javascript:') ||
        attributes.href.startsWith('data:'))
    ) {
      $(el).removeAttr('href');
    }

    if (
      attributes.src &&
      (attributes.src.startsWith('javascript:') ||
        attributes.src.startsWith('data:'))
    ) {
      $(el).removeAttr('src');
    }
  });

  return $.html();
}
