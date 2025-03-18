import * as cheerio from 'cheerio';
import { fetchDrupalImage } from './imageFetcher';

interface MediaItem {
  id: string;
  type: string;
  attributes: {
    name?: string;
    uri?: {
      url: string;
    };
  };
  relationships?: {
    field_media_image?: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export async function processBodyContent(
  content: string,
  mediaItems: MediaItem[]
): Promise<string> {
  // Load content into cheerio
  const $ = cheerio.load(content);

  // Process each image
  const promises = $('img')
    .map(async (_, img): Promise<void> => {
      const src = $(img).attr('src');
      if (src) {
        const filename = src.split('/').pop();
        if (filename) {
          try {
            const imageUrl = await fetchDrupalImage(filename);
            if (imageUrl) {
              $(img).attr('src', imageUrl);
            }
          } catch (error) {
            console.error(`Error processing image ${filename}:`, error);
          }
        }
      }
    })
    .get();

  // Wait for all image processing to complete
  await Promise.all(promises);

  // Return the processed HTML
  return $.html();
}
