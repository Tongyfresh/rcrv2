import { useState, useEffect } from 'react';
import { fetchToolboxResources } from '@/app/utils/drupalFetcher';

/**
 * Hook for fetching and managing RCR Toolbox resources
 */
export function useToolboxResources() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchToolboxResources();
        setData(response);
      } catch (err) {
        const fetchError =
          err instanceof Error
            ? err
            : new Error('Failed to fetch toolbox resources');
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to filter resources by category
  const filterByCategory = (category: string) => {
    if (!data?.resources) return [];
    return data.resources.filter(
      (resource: any) => resource.category === category
    );
  };

  // Function to get all categories
  const getCategories = () => {
    return data?.categories || [];
  };

  return {
    data,
    loading,
    error,
    filterByCategory,
    getCategories,
    refetch: async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchToolboxResources();
        setData(response);
        return response;
      } catch (err) {
        const fetchError =
          err instanceof Error
            ? err
            : new Error('Failed to fetch toolbox resources');
        setError(fetchError);
        return null;
      } finally {
        setLoading(false);
      }
    },
  };
}
