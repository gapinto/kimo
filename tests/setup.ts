// Setup global para testes
// Este arquivo roda antes de todos os testes

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.PORT = '3000';

// Timeout global para testes (5 segundos)
jest.setTimeout(5000);

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

