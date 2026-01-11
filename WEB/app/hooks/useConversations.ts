import { useState, useEffect } from 'react';
import { conversationsApi } from '@/lib/api/conversations';
import type { Conversation } from '@/lib/api/types';

export function useConversations(folderId?: string | 'null') {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = folderId ? { folder_id: folderId } : { folder_id: 'null' };
      const data = await conversationsApi.list(params);
      setConversations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [folderId]);

  return { conversations, loading, error, refetch: fetchConversations };
}