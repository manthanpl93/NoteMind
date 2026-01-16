import { useState, useEffect } from 'react';
import { modelsApi } from '@/lib/api/models';
import type { AIModel } from '@/lib/api/types';

export function useModels() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await modelsApi.list();
        setModels(response.models);
      } catch (err: any) {
        setError(err.message || 'Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, loading, error };
}