import { supabase, getSupabaseAuthUid } from './supabaseClient';

const ONBOARDING_KEY = 'onboarding_completed';
const CATEGORIES_KEY = 'preferred_categories';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const uid = getSupabaseAuthUid();
  if (!uid) return false;
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', uid)
    .eq('key', ONBOARDING_KEY)
    .maybeSingle();
  return data?.value === 'true';
}

export async function getPreferredCategories(): Promise<number[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) return [];
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', uid)
    .eq('key', CATEGORIES_KEY)
    .maybeSingle();
  if (!data?.value) return [];
  try {
    return JSON.parse(data.value) as number[];
  } catch {
    return [];
  }
}

export async function saveOnboardingPreferences(categoryIds: number[]): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) return;
  await supabase
    .from('settings')
    .upsert({ user_id: uid, key: CATEGORIES_KEY, value: JSON.stringify(categoryIds) });
  await supabase
    .from('settings')
    .upsert({ user_id: uid, key: ONBOARDING_KEY, value: 'true' });
}

export async function resetOnboarding(): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) return;
  await supabase
    .from('settings')
    .delete()
    .eq('user_id', uid)
    .eq('key', ONBOARDING_KEY);
}
