'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ensureAbsoluteUrl } from '@/app/utils/urlHelper';

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
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        // Use the base URL directly
        const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;
        if (!baseUrl) throw new Error('Drupal base URL not configured');

        // If imageName is a full URL or path, use it directly
        if (imageName.startsWith('http') || imageName.startsWith('/')) {
          setThumbnailUrl(ensureAbsoluteUrl(imageName));
          return;
        }

        // Otherwise, construct the URL to the file
        const thumbnailPath = `/sites/default/files/${imageName}`;
        setThumbnailUrl(ensureAbsoluteUrl(thumbnailPath));
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error('Error loading thumbnail:', error);
      }
    };

    if (imageName) {
      loadThumbnail();
    }
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
    <div className="bg-secondary/50 flex w-full items-center justify-center py-12">
      <div className="w-full max-w-5xl md:w-[70%]">
        <h2 className="font-body text-primary text-shadow-sm mb-6 text-center text-5xl uppercase">
          {title}
        </h2>
        <div
          id="video-container"
          className="group relative w-full overflow-hidden rounded-lg bg-black/5 pb-[56.25%] shadow-xl"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Stylish diagonal gradient overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 z-10 transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
                opacity: isHovering ? '0.7' : '0.5',
              }}
            />
          )}

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

              {/* Enhanced Play Button */}
              <button
                onClick={handlePlay}
                className="group absolute inset-0 z-20 flex h-full w-full items-center justify-center"
                aria-label="Play video"
              >
                <div
                  className={`bg-primary relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 ease-in-out ${isHovering ? 'h-24 w-24 scale-110' : 'h-20 w-20'} `}
                >
                  <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm" />

                  {/* Pulsing effect ring */}
                  <div
                    className={`absolute -inset-2 rounded-full border-4 border-white/30 transition-all duration-700 ease-in-out ${isHovering ? 'animate-ping opacity-50' : 'opacity-0'} `}
                  />

                  {/* Play triangle */}
                  <div
                    className={`relative z-10 ml-1 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[18px] border-t-transparent border-b-transparent border-l-white transition-all duration-300 ${isHovering ? 'scale-110' : ''} `}
                  />
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
