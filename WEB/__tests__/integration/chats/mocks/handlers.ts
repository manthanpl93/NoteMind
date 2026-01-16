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
    model_name: 'gpt-4o',
    message_count: 5,
    total_tokens_used: 1234,
    total_context_size: 128000,
    remaining_context_size: 126766,
    total_used_percentage: 1.0,
    remaining_percentage: 99.0,
    folder_id: null,
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T15:00:00Z',
  },
  {
    id: 'conv-2',
    title: 'TypeScript Advanced',
    provider: 'openai',
    model_name: 'gpt-4-turbo',
    message_count: 8,
    total_tokens_used: 2456,
    total_context_size: 128000,
    remaining_context_size: 125544,
    total_used_percentage: 2.0,
    remaining_percentage: 98.0,
    folder_id: null,
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T15:00:00Z',
  },
  {
    id: 'conv-3',
    title: 'Project Planning',
    provider: 'anthropic',
    model_name: 'claude-3-5-sonnet-20241022',
    message_count: 3,
    total_tokens_used: 890,
    total_context_size: 200000,
    remaining_context_size: 199110,
    total_used_percentage: 0.4,
    remaining_percentage: 99.6,
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
    total_context_size: 2000000,
    remaining_context_size: 1996544,
    total_used_percentage: 0.2,
    remaining_percentage: 99.8,
    folder_id: 'folder-1',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T14:00:00Z',
  },
];

const mockModels = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'claude-3-5-sonnet-20241022', name: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'claude-3-opus-20240229', provider: 'anthropic' },
  { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', provider: 'google' },
  { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash', provider: 'google' },
];

const mockMessages = {
  'conv-1': [
    {
      id: 'msg-1',
      role: 'user',
      content: 'What are React best practices?',
      timestamp: '2024-01-03T10:00:00Z',
      tokens_used: 5
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'React best practices include...',
      timestamp: '2024-01-03T10:00:01Z',
      tokens_used: 150
    }
  ],
  'conv-2': [
    {
      id: 'msg-3',
      role: 'user',
      content: 'Advanced TypeScript features?',
      timestamp: '2024-01-04T10:00:00Z',
      tokens_used: 4
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'Advanced TypeScript includes generics, conditional types...',
      timestamp: '2024-01-04T10:00:01Z',
      tokens_used: 200
    }
  ],
  'conv-3': [
    {
      id: 'msg-5',
      role: 'user',
      content: 'How to plan a software project?',
      timestamp: '2024-01-04T10:00:00Z',
      tokens_used: 6
    },
    {
      id: 'msg-6',
      role: 'assistant',
      content: 'Project planning involves requirements gathering, timeline estimation...',
      timestamp: '2024-01-04T10:00:01Z',
      tokens_used: 120
    }
  ],
  'conv-4': [
    {
      id: 'msg-7',
      role: 'user',
      content: 'REST API design principles?',
      timestamp: '2024-01-05T10:00:00Z',
      tokens_used: 4
    },
    {
      id: 'msg-8',
      role: 'assistant',
      content: 'API design principles include proper HTTP methods, status codes...',
      timestamp: '2024-01-05T10:00:01Z',
      tokens_used: 180
    }
  ]
};

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

  // GET /models - List available models
  http.get(`${API_URL}/models`, () => {
    return HttpResponse.json({ models: mockModels });
  }),

  // GET /conversations/:id - Get single conversation
  http.get(`${API_URL}/conversations/:conversationId`, ({ params }) => {
    const { conversationId } = params;
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      return HttpResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    return HttpResponse.json(conversation);
  }),

  // GET /conversations/:id/messages - Get conversation messages
  http.get(`${API_URL}/conversations/:conversationId/messages`, ({ params }) => {
    const { conversationId } = params;
    const messages = mockMessages[conversationId as keyof typeof mockMessages] || [];
    return HttpResponse.json(messages);
  }),

  // POST /conversations - Create new conversation
  http.post(`${API_URL}/conversations`, async ({ request }) => {
    const body = await request.json() as {
      provider: string;
      model_name: string;
      first_message: string;
      folder_id?: string | null;
    };

    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `Conversation about ${body.first_message.slice(0, 20)}...`,
      provider: body.provider,
      model_name: body.model_name,
      message_count: 1,
      total_tokens_used: 100, // Mock token usage
      total_context_size: 128000,
      remaining_context_size: 127900,
      total_used_percentage: 0.1,
      remaining_percentage: 99.9,
      folder_id: body.folder_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add first message to mock messages
    mockMessages[newConversation.id as keyof typeof mockMessages] = [
      {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: body.first_message,
        timestamp: new Date().toISOString(),
        tokens_used: 10
      },
      {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `I understand you want to talk about "${body.first_message}". How can I help?`,
        timestamp: new Date().toISOString(),
        tokens_used: 20
      }
    ];

    return HttpResponse.json(newConversation, { status: 201 });
  }),

  // POST /conversations/:id/messages - Send message
  http.post(`${API_URL}/conversations/:conversationId/messages`, async ({ params, request }) => {
    const { conversationId } = params;
    const body = await request.json() as { content: string };

    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      return HttpResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user' as const,
      content: body.content,
      timestamp: new Date().toISOString(),
      tokens_used: Math.floor(body.content.length / 4) // Mock token calculation
    };

    // Add AI response
    const aiMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant' as const,
      content: `I received your message: "${body.content}". This is a mock response.`,
      timestamp: new Date().toISOString(),
      tokens_used: 50
    };

    // Update conversation messages
    if (!mockMessages[conversationId as keyof typeof mockMessages]) {
      mockMessages[conversationId as keyof typeof mockMessages] = [];
    }
    mockMessages[conversationId as keyof typeof mockMessages].push(userMessage, aiMessage);

    // Update conversation metadata
    const updatedConversation = {
      ...conversation,
      message_count: conversation.message_count + 2,
      total_tokens_used: conversation.total_tokens_used + userMessage.tokens_used + aiMessage.tokens_used,
      updated_at: new Date().toISOString()
    };

    const conversationIndex = mockConversations.findIndex(c => c.id === conversationId);
    mockConversations[conversationIndex] = updatedConversation;

    return HttpResponse.json({
      message: aiMessage,
      conversation: updatedConversation
    });
  }),

  // PATCH /conversations/:id/model - Switch model
  http.patch(`${API_URL}/conversations/:conversationId/model`, async ({ params, request }) => {
    const { conversationId } = params;
    const body = await request.json() as { model: string };

    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      return HttpResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const updatedConversation = {
      ...conversation,
      model_name: body.model,
      updated_at: new Date().toISOString()
    };

    const conversationIndex = mockConversations.findIndex(c => c.id === conversationId);
    mockConversations[conversationIndex] = updatedConversation;

    return HttpResponse.json(updatedConversation);
  }),

  // DELETE /conversations/:id - Delete conversation
  http.delete(`${API_URL}/conversations/:conversationId`, ({ params }) => {
    const { conversationId } = params;
    const conversationIndex = mockConversations.findIndex(c => c.id === conversationId);

    if (conversationIndex === -1) {
      return HttpResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Remove conversation and messages
    mockConversations.splice(conversationIndex, 1);
    delete mockMessages[conversationId as keyof typeof mockMessages];

    return HttpResponse.json({ success: true });
  }),
];