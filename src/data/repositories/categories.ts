import { supabase } from '@/services/supabaseClient';

export type CategoryRow = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
};

export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as CategoryRow[];
}
