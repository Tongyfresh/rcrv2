import * as cheerio from 'cheerio';

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
  mediaItems: MediaItem[],
  baseURL: string
): Promise<string> {
  const $ = cheerio.load(content);

  // Process each image
  const promises = $('img')
    .map(async (_, img): Promise<void> => {
      const src = $(img).attr('src');
      if (src) {
        const filename = src.split('/').pop();
        if (filename) {
          try {
            // Find matching media item by filename
            const mediaItem = mediaItems.find(
              (item) => item.attributes.name === filename
            );
            if (mediaItem?.attributes?.uri?.url) {
              const imageUrl = new URL(mediaItem.attributes.uri.url, baseURL)
                .href;
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
