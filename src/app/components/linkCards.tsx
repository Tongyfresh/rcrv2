'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { fetchDrupalData } from '@/app/utils/drupalFetcher';
import { getDrupalImageUrl } from '@/app/utils/imageProcessor';

// Update types to match Drupal structure
type DrupalCard = {
  id: string;
  type: 'node--rcr_cards';
  attributes: {
    title: string;
    field_rcr_card_description: Array<{
      value: string;
      format: string;
      processed: string;
    }>;
  };
  relationships: {
    field_rcr_card_images: {
      data: Array<{
        type: 'media--image';
        id: string;
        meta: {
          drupal_internal__target_id: number;
        };
      }>;
    };
  };
};

const LinkCards: React.FC = () => {
  const [cards, setCards] = useState<DrupalCard[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const baseURL =
          process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] || '';
        console.log('Fetching from baseURL:', baseURL);

        // Update include to fetch nested field_media_image
        const cardData = await fetchDrupalData('node/rcr_cards', {
          include: [
            'field_rcr_card_images',
            'field_rcr_card_images.field_media_image',
          ],
          filter: {
            status: 1, // Ensure we only get published content
          },
        });

        console.log('Card Data Response:', cardData);

        // Process image URLs with improved logging
        const urls: { [key: string]: string } = {};

        if (!cardData.included) {
          console.warn('No included data found in response');
          setIsLoading(false);
          return;
        }

        console.log('Included items:', cardData.included);

        // First, log all included items to see what we're working with
        cardData.included.forEach((item: any) => {
          console.log(`Included item type: ${item.type}, id: ${item.id}`);
        });

        // Process the images
        cardData.included.forEach((item: any) => {
          if (item.type === 'media--image') {
            // Try direct URL construction first
            let imageUrl;

            if (item.relationships?.field_media_image?.data?.id) {
              // Find the file entity in included data
              const fileId = item.relationships.field_media_image.data.id;
              const fileEntity = cardData.included.find(
                (inc: any) => inc.id === fileId
              );

              if (fileEntity && fileEntity.attributes?.uri?.url) {
                imageUrl = `${baseURL}${fileEntity.attributes.uri.url}`;
                console.log(`Found image URL from file entity: ${imageUrl}`);
              }
            }

            // Fallback to getDrupalImageUrl
            if (!imageUrl) {
              imageUrl = getDrupalImageUrl(cardData, item.id, baseURL);
              console.log(
                `Using getDrupalImageUrl: ${imageUrl} for id: ${item.id}`
              );
            }

            if (imageUrl) {
              urls[item.id] = imageUrl;
              console.log(`Added image URL: ${imageUrl} for id: ${item.id}`);
            } else {
              console.warn(`No image URL found for media ID: ${item.id}`);
            }
          }
        });

        console.log('Final image URLs:', urls);
        setCards(cardData.data);
        setImageUrls(urls);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Create static card data array
  const staticCards = [
    {
      title: 'Where We Operate',
      link: '/where-we-operate',
    },
    {
      title: "We're Adding Partners",
      link: '/were-adding-partners',
    },
    {
      title: 'Current Projects',
      link: '/current-projects',
    },
  ];

  // Helper function to clean HTML tags from text
  const cleanHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (isLoading) {
    return <div className="w-full bg-white py-16">Loading...</div>;
  }

  return (
    <div className="w-full bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {staticCards.map((staticCard, index) => {
            const card = cards[0];
            const imageId =
              card?.relationships?.field_rcr_card_images?.data?.[index]?.id;
            const imageUrl = imageId ? imageUrls[imageId] : null;
            const description =
              card?.attributes?.field_rcr_card_description[index]?.value || '';

            return (
              <Link
                key={index}
                href={staticCard.link}
                className="group overflow-hidden rounded-sm bg-gray-100 shadow-md transition-all hover:shadow-xl"
              >
                <div className="relative h-75 w-full overflow-hidden">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={staticCard.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-body text-primary mb-4 text-xl font-medium">
                    {staticCard.title}
                  </h3>
                  <p className="text-gray-600">{cleanHtmlTags(description)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LinkCards;
