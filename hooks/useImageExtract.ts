import { useMemo } from 'react';
import { getRelatedImageUrl } from '@/app/utils/drupalFetcher';

/**
 * Hook for extracting image URLs from Drupal response
 * @param entity The entity containing image relationships
 * @param included Array of included entities
 * @param fieldName The field name to extract the image from
 */
export function useDrupalImage(
  entity: any,
  included: any[] = [],
  fieldName: string
) {
  return useMemo(() => {
    return getRelatedImageUrl(entity, included, fieldName);
  }, [entity, included, fieldName]);
}
