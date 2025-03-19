'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  imageName: string;
}

export default function VideoPlayer({
  videoId,
  title,
  imageName,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0];
        if (!baseUrl) throw new Error('API URL not configured');

        const response = await fetch(
          `${baseUrl}/jsonapi/media/image?filter[name][value]=${imageName}`,
          {
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch image');

        const data = await response.json();
        const fileUrl =
          data.data[0]?.relationships?.field_media_image?.data?.id;

        if (fileUrl) {
          const fileResponse = await fetch(
            `${baseUrl}/jsonapi/file/file/${fileUrl}`,
            {
              headers: {
                Accept: 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
              },
            }
          );

          if (!fileResponse.ok) throw new Error('Failed to fetch file');

          const fileData = await fileResponse.json();
          const imageUrl = fileData.data?.attributes?.uri?.url;

          if (imageUrl) {
            setThumbnailUrl(`${baseUrl}${imageUrl}`);
          }
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('VideoPlayer thumbnail error:', err);
      }
    };

    loadThumbnail();
  }, [imageName]);

  const handlePlay = () => setIsPlaying(true);

  if (error) {
    return (
      <div className="w-full py-12">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-12">
      <div className="w-full max-w-5xl md:w-[70%]">
        <h2 className="font-body text-primary mb-6 text-center text-2xl">
          {title}
        </h2>
        <div
          id="video-container"
          className="group relative w-full overflow-hidden rounded-lg bg-black/5 pb-[56.25%]"
        >
          {!isPlaying ? (
            <div className="absolute inset-0">
              {thumbnailUrl && (
                <div className="relative h-full w-full">
                  <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="rounded-lg object-cover"
                    priority
                  />
                </div>
              )}
              <button
                onClick={handlePlay}
                className="group absolute inset-0 flex h-full w-full items-center justify-center"
                aria-label="Play video"
              >
                <div className="relative inset-0 z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white/70 shadow-lg transition-transform group-hover:scale-110 hover:shadow-xl">
                  <svg
                    className="text-primary/70 h-10 w-10 translate-x-1 transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </div>
          ) : (
            <iframe
              title={`YouTube video player - ${title}`}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="absolute top-0 left-0 h-full w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
