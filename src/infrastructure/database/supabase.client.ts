import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase Singleton
 * Princípio: Single Responsibility - apenas cria e mantém cliente Supabase
 */
export class SupabaseClientFactory {
  private static instance: SupabaseClient | null = null;

  private constructor() {
    // Private constructor para Singleton
  }

  public static getInstance(): SupabaseClient {
    if (!this.instance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY'
        );
      }

      this.instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.instance;
  }

  // Para testes: permite injetar cliente mockado
  public static setInstance(client: SupabaseClient): void {
    this.instance = client;
  }

  // Para testes: limpar instância
  public static resetInstance(): void {
    this.instance = null;
  }
}

// Export função helper
export const getSupabaseClient = (): SupabaseClient => {
  return SupabaseClientFactory.getInstance();
};

