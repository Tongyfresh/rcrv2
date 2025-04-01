import { useState, useEffect } from 'react';
import { discoverAvailableFields } from '@/app/utils/drupalFetcher';

/**
 * Hook for discovering available fields for a content type
 * @param contentType The content type to discover fields for
 */
export function useDiscoverFields(contentType: string) {
  const [fields, setFields] = useState<string[]>([]);
  const [relationships, setRelationships] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const discoverFields = async () => {
      try {
        setLoading(true);
        setError(null);
        const { fields, relationships } =
          await discoverAvailableFields(contentType);
        setFields(fields);
        setRelationships(relationships);
      } catch (err) {
        const discoverError =
          err instanceof Error ? err : new Error('Failed to discover fields');
        setError(discoverError);
      } finally {
        setLoading(false);
      }
    };

    discoverFields();
  }, [contentType]);

  return {
    fields,
    relationships,
    loading,
    error,
  };
}
