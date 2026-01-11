import { useState, useEffect } from 'react';
import { foldersApi } from '@/lib/api/folders';
import type { Folder } from '@/lib/api/types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await foldersApi.list();
      setFolders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  return { folders, loading, error, refetch: fetchFolders };
}