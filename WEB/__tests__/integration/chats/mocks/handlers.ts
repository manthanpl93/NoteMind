import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
  {
    id: 'conv-4',
    title: 'API Design',
    provider: 'google',
    model_name: 'gemini-1.5-pro',
    message_count: 12,
    total_tokens_used: 3456,
    folder_id: 'folder-1',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T14:00:00Z',
  },
];

export const handlers = [
  // GET /folders - List folders
  http.get(`${API_URL}/folders`, () => {
    return HttpResponse.json(mockFolders);
  }),

  // POST /folders - Create folder
  http.post(`${API_URL}/folders`, async ({ request }) => {
    const body = await request.json() as { name: string };
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: body.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(newFolder, { status: 201 });
  }),

  // GET /conversations - List conversations with filtering
  http.get(`${API_URL}/conversations`, ({ request }) => {
    const url = new URL(request.url);
    const folderId = url.searchParams.get('folder_id');

    if (folderId === 'null') {
      // Return unorganized conversations
      return HttpResponse.json(
        mockConversations.filter(c => c.folder_id === null)
      );
    } else if (folderId) {
      // Return conversations in specific folder
      return HttpResponse.json(
        mockConversations.filter(c => c.folder_id === folderId)
      );
    }

    // Return all conversations
    return HttpResponse.json(mockConversations);
  }),
];