"use client"

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  videoId: string
  title: string
  imageName: string // Pass the image name (e.g., "rcr_wheat.png")
}

export default function VideoPlayer({ videoId, title, imageName }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0]
        
        if (!baseUrl) {
          throw new Error('API URL not configured')
        }

        const mediaUrl = `${baseUrl}/jsonapi/media/image?filter[name]=${imageName}`
        
        const mediaResponse = await fetch(mediaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Basic ${process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN}`,
          },
          // Remove credentials if not needed for authentication
          credentials: 'omit'
        })

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text()
          console.error('Response:', {
            status: mediaResponse.status,
            statusText: mediaResponse.statusText,
            headers: Object.fromEntries(mediaResponse.headers),
            body: errorText
          })
          throw new Error(`Media fetch failed: ${mediaResponse.status} - ${errorText}`)
        }

        const mediaData = await mediaResponse.json()

        if (!mediaData.data?.[0]) {
          throw new Error('No media found')
        }

        // Second request
        const imageUrl = mediaData.data[0].relationships.field_media_image.links.related.href
        const fileResponse = await fetch(imageUrl, {
          headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Basic ${process.env.NEXT_PUBLIC_DRUPAL_AUTH_TOKEN}`,
          },
          credentials: 'omit'
        })

        if (!fileResponse.ok) {
          throw new Error(`File fetch failed: ${fileResponse.status}`)
        }

        const fileData = await fileResponse.json()

        if (!fileData.data?.attributes?.uri?.url) {
          throw new Error('File URL not found')
        }

        const fileUrl = fileData.data.attributes.uri.url
        setThumbnailUrl(`${baseUrl}${fileUrl}`)
        
      } catch (err) {
        console.error('Detailed error:', {
          name: (err as Error).name,
          message: (err as Error).message,
          stack: (err as Error).stack
        })
        setError((err as Error).message)
      }
    }

    fetchImage()
  }, [imageName])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <div className="mt-12 w-full">
      <h2 className="text-2xl font-body text-primary mb-6">{title}</h2>
      <div id="video-container" className="relative w-full pb-[56.25%] bg-black/5 rounded-lg group overflow-hidden">
        {!isPlaying ? (
          <div className="absolute inset-0">
            {/* Thumbnail */}
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
              />
            )}
            {/* Play Button */}
            <button
              onClick={handlePlay}
              className="absolute inset-0 w-full h-full flex items-center justify-center group"
              aria-label="Play video"
            >
              <div className="relative inset-0 z-10 w-20 h-20 bg-white/70 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg hover:shadow-xl">
                <svg 
                  className="w-10 h-10 text-primary/70 transform translate-x-1" 
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
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}