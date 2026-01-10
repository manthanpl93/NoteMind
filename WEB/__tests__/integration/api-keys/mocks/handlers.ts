// Mock API handlers for integration tests

export const createMockApiResponse = <T>(
  data: T,
  status: number = 200
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? "OK" : "Error",
    type: "default",
    url: "",
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
  } as Response;
};

export const mockGetApiKeysSuccess = {
  openai_api_key: "sk-...****",
  anthropic_api_key: "sk-ant-...****",
  google_api_key: null,
};

export const mockGetApiKeysEmpty = {
  openai_api_key: null,
  anthropic_api_key: null,
  google_api_key: null,
};

export const mockUpdateApiKeysSuccess = {
  openai_api_key: "sk-...****",
  anthropic_api_key: "sk-ant-...****",
  google_api_key: "AIza...****",
};
