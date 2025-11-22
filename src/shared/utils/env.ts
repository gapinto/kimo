import 'dotenv/config';

/**
 * Configurações do ambiente
 * Valida e exporta variáveis de ambiente
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value ?? '';
}

export const env = {
  // Node
  nodeEnv: getEnvVar('NODE_ENV', false) || 'development',
  port: parseInt(getEnvVar('PORT', false) || '3000', 10),

  // Supabase
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    serviceKey: getEnvVar('SUPABASE_SERVICE_KEY'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY', false),
  },

  // WhatsApp
  whatsapp: {
    provider: getEnvVar('WHATSAPP_PROVIDER', false) || 'evolution',
    evolutionApiUrl: getEnvVar('EVOLUTION_API_URL', false),
    evolutionApiKey: getEnvVar('EVOLUTION_API_KEY', false),
    evolutionInstanceName: getEnvVar('EVOLUTION_INSTANCE_NAME', false) || 'kimo',
  },
} as const;

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';

