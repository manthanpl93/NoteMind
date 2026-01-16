import { useState, useCallback } from 'react';
import { conversationsApi, messagesApi } from '@/lib/api';
import type { ConversationWithMessages, Message } from '@/lib/api/types';

interface OpenTab {
  id: string;
  conversationId: string | null;
  title: string;
}

interface ConversationData extends ConversationWithMessages {
  messages: Message[];
}

export function useOpenTabs() {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [conversationCache, setConversationCache] = useState<Map<string, ConversationData>>(new Map());

  // Generate unique ID for tabs
  const generateTabId = useCallback(() => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Open conversation (check if already open, switch or create new)
  const openConversation = useCallback(async (conversationId: string) => {
    // Check if tab already exists
    const existingTab = openTabs.find(tab => tab.conversationId === conversationId);

    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(existingTab.id);
      return;
    }

    // Check if conversation is in cache
    let conversationData: ConversationData | undefined;
    if (!conversationCache.has(conversationId)) {
      // Fetch conversation metadata and messages
      try {
        const [conversation, messages] = await Promise.all([
          conversationsApi.get(conversationId),
          messagesApi.list(conversationId)
        ]);
    
        // Handle case where API might return messages in different format
        let messagesArray: Message[] = [];
        if (Array.isArray(messages)) {
          messagesArray = messages;
        } else if (messages && typeof messages === 'object' && 'messages' in messages) {
          // Handle case where API returns { messages: [...] }
          messagesArray = Array.isArray((messages as any).messages) ? (messages as any).messages : [];
        } else if (messages && typeof messages === 'object' && 'data' in messages) {
          // Handle case where API returns { data: [...] }
          messagesArray = Array.isArray((messages as any).data) ? (messages as any).data : [];
        }
    
        conversationData = {
          ...conversation,
          messages: messagesArray
        };

        // Update cache with the conversation data
        setConversationCache(prev => {
          const updated = new Map(prev);
          updated.set(conversationId, conversationData!);
          return updated;
        });
      } catch (error) {
        return;
      }
    } else {
      conversationData = conversationCache.get(conversationId);
    }

    // Create new tab with title from fetched/cached data
    const newTab: OpenTab = {
      id: generateTabId(),
      conversationId,
      title: conversationData?.title || 'Loading...'
    };

    // Update tabs and active tab
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [openTabs, conversationCache, generateTabId]);

  // Close tab
  const closeTab = useCallback((tabId: string) => {
    const updatedTabs = openTabs.filter(tab => tab.id !== tabId);
    const closedTab = openTabs.find(tab => tab.id === tabId);

    // Check if any other tab references this conversation
    const stillInUse = updatedTabs.some(tab => tab.conversationId === closedTab?.conversationId);

    if (!stillInUse && closedTab?.conversationId) {
      // Clean up cache if no other tabs reference it
      setConversationCache(prev => {
        const updated = new Map(prev);
        updated.delete(closedTab.conversationId);
        return updated;
      });
    }

    setOpenTabs(updatedTabs);

    // Handle active tab switching
    if (tabId === activeTabId) {
      if (updatedTabs.length > 0) {
        // Switch to the last remaining tab
        const lastTab = updatedTabs[updatedTabs.length - 1];
        setActiveTabId(lastTab.id);
      } else {
        // No more tabs
        setActiveTabId(null);
      }
    }
  }, [openTabs, activeTabId]);

  // Switch to tab
  const switchTab = useCallback((tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
    }
  }, [openTabs]);

  // Create new conversation tab
  const createNewConversation = useCallback(() => {
    const newTab: OpenTab = {
      id: generateTabId(),
      conversationId: null,
      title: 'Untitled'
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [generateTabId]);

  // Clear active tab but preserve all tabs and cache (for going back to overview)
  const clearActiveTab = useCallback(() => {
    setActiveTabId(null);
    // Tabs and cache are preserved - can quickly return to any conversation
  }, []);

  // Update tab title
  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.id === tabId ? { ...tab, title } : tab
      )
    );
  }, []);

  // Update tab conversation ID (for new conversations)
  const updateTabConversationId = useCallback((tabId: string, conversationId: string) => {
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.id === tabId ? { ...tab, conversationId } : tab
      )
    );
  }, []);

  // Refresh conversation data
  const refreshConversation = useCallback(async (conversationId: string) => {
    try {
      const [conversation, messages] = await Promise.all([
        conversationsApi.get(conversationId),
        messagesApi.list(conversationId)
      ]);

      setConversationCache(prev => new Map(prev).set(conversationId, {
        ...conversation,
        messages
      }));

      // Update tab title if it changed
      const tab = openTabs.find(t => t.conversationId === conversationId);
      if (tab && tab.title !== conversation.title) {
        updateTabTitle(tab.id, conversation.title);
      }
    } catch (error) {
      // Error handling - conversation refresh failed
    }
  }, [openTabs, updateTabTitle]);

  // Update conversation cache after sending message
  const updateConversationAfterMessage = useCallback((conversationId: string, message: Message, updatedConversation: any) => {
    setConversationCache(prev => {
      const updated = new Map(prev);
      const cached = updated.get(conversationId);
      if (cached) {
        const existingMessages = Array.isArray(cached.messages) ? cached.messages : [];
        updated.set(conversationId, {
          ...cached,
          ...updatedConversation,
          messages: [...existingMessages, message]
        });
      }
      return updated;
    });
  }, []);

  // Add new conversation to cache
  // Note: Messages can be provided directly or fetched separately via messagesApi.list()
  const addConversationToCache = useCallback((conversation: ConversationWithMessages) => {
    setConversationCache(prev => new Map(prev).set(conversation.id, {
      ...conversation,
      messages: conversation.messages || [] // Preserve messages if provided
    }));
  }, []);

  // Get active conversation data
  const getActiveConversation = useCallback(() => {
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    if (activeTab?.conversationId) {
      return conversationCache.get(activeTab.conversationId) || null;
    }
    return null;
  }, [openTabs, activeTabId, conversationCache]);

  return {
    openTabs,
    activeTabId,
    openConversation,
    closeTab,
    switchTab,
    createNewConversation,
    clearActiveTab,
    updateTabTitle,
    updateTabConversationId,
    refreshConversation,
    updateConversationAfterMessage,
    addConversationToCache,
    getActiveConversation
  };
}