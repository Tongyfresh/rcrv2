interface DrupalImageOptions {
  contentType?: string;
  fieldName?: string;
  nodeId?: string;
}

export async function fetchDrupalImage(
  imageName: string,
  options?: DrupalImageOptions
): Promise<string | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0];

    if (!baseUrl) {
      throw new Error('API URL not configured');
    }

    // Try content type first if options are provided
    if (options?.contentType && options?.fieldName && options?.nodeId) {
      const contentUrl =
        `${baseUrl}/jsonapi/${options.contentType}/${options.nodeId}?` +
        [
          'filter[status][value]=1',
          `fields[${options.contentType}]=${options.fieldName}`,
          `include=${options.fieldName}`,
        ].join('&');

      const contentResponse = await fetch(contentUrl, {
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Basic ${process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN}`,
        },
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        const imageUrl = contentData.included?.[0]?.attributes?.uri?.url;
        if (imageUrl) {
          return `${baseUrl}${imageUrl}`;
        }
      }
    }

    // Fall back to media library search
    const mediaUrl =
      `${baseUrl}/jsonapi/media/image?` +
      [
        'filter[status][value]=1',
        `filter[name][value]=${encodeURI(imageName)}`,
        'fields[media--image]=name,thumbnail,field_media_image',
        'fields[file--file]=uri,url',
        'include=field_media_image',
      ].join('&');

    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Basic ${process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new Error(`Media fetch failed: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();

    if (!mediaData.data || mediaData.data.length === 0) {
      throw new Error('No media found for the given image name');
    }

    const fileData = mediaData.included?.[0];
    if (!fileData || !fileData.attributes.uri.url) {
      throw new Error('File data not found in response');
    }

    return `${baseUrl}${fileData.attributes.uri.url}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}
