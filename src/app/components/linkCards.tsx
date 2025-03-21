'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { fetchDrupalData } from '@/app/utils/drupalFetcher';
import { getDrupalImageUrl } from '@/app/utils/imageProcessor';
import { ProcessedImage } from '@/types/drupal';

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

// Update props type to accept homepage data
type LinkCardsProps = {
  homeData?: any; // Optional, so component can still work standalone
  cardImages?: ProcessedImage[];
  baseURL?: string;
};

const LinkCards: React.FC<LinkCardsProps> = ({
  homeData,
  cardImages,
  baseURL: propBaseURL,
}) => {
  const [cards, setCards] = useState<DrupalCard[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(!homeData); // Not loading if homeData provided

  useEffect(() => {
    // If homeData is provided, use it instead of fetching
    if (homeData) {
      processHomeData();
      return;
    }

    // Otherwise, fetch as before
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
  }, [homeData]);

  // Update the processHomeData function
  const processHomeData = () => {
    if (!homeData) return;

    const urls: { [key: string]: string } = {};

    console.log('Processing home data for cards:', homeData);

    // If cardImages are pre-processed, use them
    if (cardImages && cardImages.length > 0) {
      console.log('Using pre-processed card images:', cardImages);
      cardImages.forEach((image) => {
        if (image.url) {
          urls[image.id] = image.url;
        }
      });

      setImageUrls(urls);
      setCards([homeData.data[0]]); // Use homepage as the card data
      return;
    }

    // Otherwise process images from homeData
    const baseURL =
      propBaseURL ||
      process.env.NEXT_PUBLIC_DRUPAL_API_URL?.split('/jsonapi')[0] ||
      '';

    console.log('Attempting to process card images from homeData');

    // Check if we have included data and card image relationships
    if (
      homeData.included &&
      homeData.data[0]?.relationships?.field_rcr_card_images?.data
    ) {
      // Get the card image references
      const cardImageRefs =
        homeData.data[0].relationships.field_rcr_card_images.data;
      console.log('Card image references:', cardImageRefs);

      // Process each image reference
      if (Array.isArray(cardImageRefs)) {
        cardImageRefs.forEach((imageRef) => {
          if (!imageRef?.id) return;

          console.log(`Processing card image ref: ${imageRef.id}`);

          // Try to find media item in included data
          const mediaItem = homeData.included.find(
            (item: { type: string; id: any }) =>
              item.type === 'media--image' && item.id === imageRef.id
          );

          if (!mediaItem) {
            console.log(`Media item ${imageRef.id} not found in included data`);
            return;
          }

          // Try to find the file entity for this media
          let fileId = null;
          if (mediaItem.relationships?.field_media_image?.data?.id) {
            fileId = mediaItem.relationships.field_media_image.data.id;
          }

          if (!fileId) {
            console.log(`No file ID found for media ${imageRef.id}`);
            return;
          }

          // Find the file in included data
          const fileEntity = homeData.included.find(
            (item: { type: string; id: any }) =>
              item.type === 'file--file' && item.id === fileId
          );

          if (!fileEntity || !fileEntity.attributes?.uri?.url) {
            console.log(`File entity ${fileId} not found or missing URI`);
            return;
          }

          // Construct the URL
          const imageUrl = `${baseURL}${fileEntity.attributes.uri.url}`;
          console.log(`Found image URL: ${imageUrl} for media ${imageRef.id}`);

          urls[imageRef.id] = imageUrl;
        });
      } else {
        console.log('Card image references is not an array:', cardImageRefs);
      }
    } else {
      console.log('No included data or card image relationships found');
    }

    console.log('Final processed image URLs:', urls);
    setCards([homeData.data[0]]);
    setImageUrls(urls);
  };

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
            // Get data from either cards[0] (API fetch) or homeData.data[0] (passed prop)
            const card = cards[0];

            // Get image ID flexibly, checking multiple locations
            const imageId =
              card?.relationships?.field_rcr_card_images?.data?.[index]?.id;

            // Get URL from either pre-processed cardImages or from our imageUrls state
            const imageUrl = imageId ? imageUrls[imageId] : null;

            // Get description text, checking field_rcr_card_description
            let description = '';
            if (Array.isArray(card?.attributes?.field_rcr_card_description)) {
              description =
                card?.attributes?.field_rcr_card_description[index]?.value ||
                '';
            } else if (
              card?.attributes?.field_rcr_card_description &&
              typeof card?.attributes?.field_rcr_card_description ===
                'object' &&
              'value' in card.attributes.field_rcr_card_description
            ) {
              // Handle case where it's not an array but an object with a value property
              description =
                (
                  card.attributes.field_rcr_card_description as {
                    value: string;
                  }
                ).value || '';
            }

            return (
              <Link
                key={index}
                href={staticCard.link}
                className="group overflow-hidden rounded-sm bg-gray-200 shadow-md transition-all hover:shadow-xl"
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
