import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Create a single Supabase client instance to avoid multiple GoTrueClient warnings
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
