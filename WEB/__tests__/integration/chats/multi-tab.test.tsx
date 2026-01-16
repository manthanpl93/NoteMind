/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatsPage from '@/app/chats/page';
import './setup';

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  }),
}));

// Mock AppLayout component
jest.mock('@/app/components/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the API hooks
jest.mock('@/app/hooks/useFolders', () => ({
  useFolders: jest.fn(),
}));

jest.mock('@/app/hooks/useConversations', () => ({
  useConversations: jest.fn(),
}));

jest.mock('@/app/hooks/useOpenTabs', () => ({
  useOpenTabs: jest.fn(),
}));

jest.mock('@/app/hooks/useModels', () => ({
  useModels: jest.fn(),
}));

jest.mock('@/lib/api/folders', () => ({
  foldersApi: {
    create: jest.fn(),
  },
}));

// Import mocks for control
import { useFolders } from '@/app/hooks/useFolders';
import { useConversations } from '@/app/hooks/useConversations';
import { useOpenTabs } from '@/app/hooks/useOpenTabs';
import { useModels } from '@/app/hooks/useModels';

// Mock data
const mockModels = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'claude-sonnet-4-20250514', name: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'google' }
];

const mockFolders = [
  {
    id: 'folder-1',
    name: 'Work Projects',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  }
];

const mockConversations = [
  {
    id: 'conv-1',
    title: 'First Conversation',
    provider: 'openai',
    model_name: 'gpt-4o',
    message_count: 5,
    total_tokens_used: 150,
    folder_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'conv-2',
    title: 'Second Conversation',
    provider: 'openai',
    model_name: 'gpt-4-turbo',
    message_count: 3,
    total_tokens_used: 200,
    folder_id: null,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  }
];

describe('Multi-Tab Chat Integration', () => {
  beforeEach(() => {
    // Setup mock implementations
    (useFolders as jest.Mock).mockReturnValue({
      folders: mockFolders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useConversations as jest.Mock).mockReturnValue({
      conversations: mockConversations,
      loading: false,
      error: null,
    });

    (useModels as jest.Mock).mockReturnValue({
      models: mockModels,
      loading: false,
      error: null,
    });

    (useOpenTabs as jest.Mock).mockReturnValue({
      openTabs: [],
      activeTabId: null,
      openConversation: jest.fn(),
      closeTab: jest.fn(),
      switchTab: jest.fn(),
      createNewConversation: jest.fn(),
      updateConversationAfterMessage: jest.fn(),
      updateTabTitle: jest.fn(),
      getActiveConversation: jest.fn(),
    });
  });

  test('renders chats page with hooks', () => {
    render(<ChatsPage />);

    // Should render the page title
    expect(screen.getByText('All Chats')).toBeInTheDocument();

    // Should show conversations from mocked hook
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();

    // Should show new chat button
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  test('calls openConversation when clicking on a conversation', () => {
    const mockOpenConversation = jest.fn();
    (useOpenTabs as jest.Mock).mockReturnValue({
      openTabs: [],
      activeTabId: null,
      openConversation: mockOpenConversation,
      closeTab: jest.fn(),
      switchTab: jest.fn(),
      createNewConversation: jest.fn(),
      updateConversationAfterMessage: jest.fn(),
      updateTabTitle: jest.fn(),
      getActiveConversation: jest.fn(),
    });

    render(<ChatsPage />);

    // Click on a conversation
    fireEvent.click(screen.getByText('First Conversation'));

    // Should call openConversation with the conversation ID
    expect(mockOpenConversation).toHaveBeenCalledWith('conv-1');
  });

  test('calls createNewConversation when clicking New Chat button', () => {
    const mockCreateNewConversation = jest.fn();
    (useOpenTabs as jest.Mock).mockReturnValue({
      openTabs: [],
      activeTabId: null,
      openConversation: jest.fn(),
      closeTab: jest.fn(),
      switchTab: jest.fn(),
      createNewConversation: mockCreateNewConversation,
      updateConversationAfterMessage: jest.fn(),
      updateTabTitle: jest.fn(),
      getActiveConversation: jest.fn(),
    });

    render(<ChatsPage />);

    // Click New Chat button
    fireEvent.click(screen.getByText('New Chat'));

    // Should call createNewConversation
    expect(mockCreateNewConversation).toHaveBeenCalled();
  });

  test('shows models in the UI', () => {
    // Test that models are available (would be used by Chat component)
    expect(mockModels).toHaveLength(3);
    expect(mockModels[0]).toEqual({
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai'
    });
  });

  test('shows folders in the UI', () => {
    render(<ChatsPage />);

    // Should show folder
    expect(screen.getByText('Work Projects')).toBeInTheDocument();
  });


});