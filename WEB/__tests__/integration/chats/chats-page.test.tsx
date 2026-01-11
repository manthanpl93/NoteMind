/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatsPage from '@/app/chats/page';
import './setup';

// Mock next-auth session
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

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

jest.mock('@/lib/api/folders', () => ({
  foldersApi: {
    create: jest.fn(),
  },
}));

// Import mocks for control
import { useFolders } from '@/app/hooks/useFolders';
import { useConversations } from '@/app/hooks/useConversations';
import { foldersApi } from '@/lib/api/folders';

const mockUseFolders = useFolders as jest.MockedFunction<typeof useFolders>;
const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;
const mockFoldersApiCreate = foldersApi.create as jest.MockedFunction<typeof foldersApi.create>;

// Mock data
const mockFolders = [
  {
    id: 'folder-1',
    name: 'Work Projects',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'folder-2',
    name: 'Personal',
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
  },
];

const mockConversations = [
  {
    id: 'conv-1',
    title: 'React Best Practices',
    provider: 'openai',
    model_name: 'gpt-4o-mini',
    message_count: 5,
    total_tokens_used: 1234,
    folder_id: null,
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T15:00:00Z',
  },
  {
    id: 'conv-2',
    title: 'TypeScript Advanced',
    provider: 'openai',
    model_name: 'gpt-4',
    message_count: 8,
    total_tokens_used: 2456,
    folder_id: null,
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T15:00:00Z',
  },
];

const mockFolderConversations = [
  {
    id: 'conv-3',
    title: 'Project Planning',
    provider: 'anthropic',
    model_name: 'claude-3-5-sonnet',
    message_count: 3,
    total_tokens_used: 890,
    folder_id: 'folder-1',
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T12:00:00Z',
  },
];

describe('Chats Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();

    // Set up default mock implementations
    mockUseFolders.mockReturnValue({
      folders: mockFolders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockFoldersApiCreate.mockResolvedValue({
      id: 'folder-new',
      name: 'New Test Folder',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  const renderChatsPage = () => {
    return render(<ChatsPage />);
  };

  it('should render the page without crashing', () => {
    expect(() => renderChatsPage()).not.toThrow();
  });

  describe('Main View - Initial Page Load', () => {
    it('should load and display folders and unorganized conversations', async () => {
      renderChatsPage();

      // Should display folders immediately (not loading)
      expect(screen.getByText('Work Projects')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();

      // Should display unorganized conversations
      expect(screen.getByText('React Best Practices')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Advanced')).toBeInTheDocument();

      // Should NOT show conversations that are in folders
      expect(screen.queryByText('Project Planning')).not.toBeInTheDocument();
    });

    it('should display conversation metadata correctly', async () => {
      renderChatsPage();

      await waitFor(() => {
        expect(screen.getByText('React Best Practices')).toBeInTheDocument();
      });

      // Should show message count
      expect(screen.getByText(/5 msg/i)).toBeInTheDocument();

      // Should show updated date
      expect(screen.getByText(/2024-01-03/i)).toBeInTheDocument();
    });
  });

  describe('Folder Navigation Flow', () => {
    it('should load folder conversations when clicking a folder', async () => {
      const user = userEvent.setup();

      // Mock the folder conversations hook to return folder conversations
      mockUseConversations.mockImplementation((folderId) => {
        if (folderId === 'folder-1') {
          return {
            conversations: mockFolderConversations,
            loading: false,
            error: null,
            refetch: jest.fn(),
          };
        }
        return {
          conversations: mockConversations,
          loading: false,
          error: null,
          refetch: jest.fn(),
        };
      });

      renderChatsPage();

      // Click on "Work Projects" folder
      const folderButton = screen.getByText('Work Projects').closest('button');
      await user.click(folderButton!);

      // Should show folder name and back button
      expect(screen.getByText('Back to all folders')).toBeInTheDocument();

      // Should show conversations in this folder
      expect(screen.getByText('Project Planning')).toBeInTheDocument();

      // Should NOT show unorganized conversations
      expect(screen.queryByText('React Best Practices')).not.toBeInTheDocument();
      expect(screen.queryByText('TypeScript Advanced')).not.toBeInTheDocument();
    });

    it('should navigate back to main view from folder', async () => {
      const user = userEvent.setup();
      renderChatsPage();

      // Navigate into folder
      await waitFor(() => {
        expect(screen.getByText('Work Projects')).toBeInTheDocument();
      });
      const folderButton = screen.getByText('Work Projects').closest('button');
      await user.click(folderButton!);

      // Wait for folder view
      await waitFor(() => {
        expect(screen.getByText('Back to all folders')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('Back to all folders');
      await user.click(backButton);

      // Should return to main view showing all folders
      await waitFor(() => {
        expect(screen.getByText('Work Projects')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
        expect(screen.getByText('React Best Practices')).toBeInTheDocument();
      });
    });

    it('should show empty state for folder with no conversations', async () => {
      const user = userEvent.setup();
      renderChatsPage();

      // Click on "Personal" folder (has no conversations)
      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
      const folderButton = screen.getByText('Personal').closest('button');
      await user.click(folderButton!);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/no chats in this folder/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Folder Flow', () => {
    it('should open create folder modal and create a new folder', async () => {
      const user = userEvent.setup();
      renderChatsPage();

      // Click "New Folder" button
      const newFolderButton = screen.getByText(/new folder/i);
      await user.click(newFolderButton);

      // Modal should open
      expect(screen.getByText('Create New Folder')).toBeInTheDocument();

      // Enter folder name
      const input = screen.getByPlaceholderText(/e.g., Work, Personal/i);
      await user.type(input, 'Test Folder');

      // Click create button
      const createButton = screen.getByRole('button', { name: /create folder/i });
      await user.click(createButton);

      // Should call the API
      await waitFor(() => {
        expect(mockFoldersApiCreate).toHaveBeenCalledWith('Test Folder');
      });

      // Modal should close
      expect(screen.queryByText('Create New Folder')).not.toBeInTheDocument();
    });

    it('should validate required folder name', async () => {
      const user = userEvent.setup();
      renderChatsPage();

      await waitFor(() => {
        expect(screen.getByText('Work Projects')).toBeInTheDocument();
      });

      // Open modal
      const newFolderButton = screen.getByText(/new folder/i);
      await user.click(newFolderButton);

      // Try to submit without name
      const createButton = screen.getByRole('button', { name: /create folder/i });
      expect(createButton).toBeDisabled();
    });

    it('should cancel folder creation', async () => {
      const user = userEvent.setup();
      renderChatsPage();

      await waitFor(() => {
        expect(screen.getByText('Work Projects')).toBeInTheDocument();
      });

      // Open modal
      const newFolderButton = screen.getByText(/new folder/i);
      await user.click(newFolderButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Create New Folder')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    it('should display error message when folders fail to load', async () => {
      // Mock error state
      mockUseFolders.mockReturnValue({
        folders: [],
        loading: false,
        error: 'Failed to load folders',
        refetch: jest.fn(),
      });

      renderChatsPage();

      // Should show error message
      expect(screen.getByText(/failed to load folders/i)).toBeInTheDocument();
    });

    it('should display error message when conversations fail to load', async () => {
      mockUseConversations.mockReturnValue({
        conversations: [],
        loading: false,
        error: 'Failed to load conversations',
        refetch: jest.fn(),
      });

      renderChatsPage();

      // Should show error message
      expect(screen.getByText(/failed to load conversations/i)).toBeInTheDocument();
    });
  });

  describe('Empty State - No Data', () => {
    it('should show empty state when no folders and no conversations', async () => {
      const { server } = await import('./setup');
      const { http, HttpResponse } = await import('msw');

      server.use(
        http.get('http://127.0.0.1:8000/folders', () => {
          return HttpResponse.json([]);
        }),
        http.get('http://127.0.0.1:8000/conversations', () => {
          return HttpResponse.json([]);
        })
      );

      renderChatsPage();

      await waitFor(() => {
        expect(screen.getByText(/no chats yet/i)).toBeInTheDocument();
      });
    });
  });
});