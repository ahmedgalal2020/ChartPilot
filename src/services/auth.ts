import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

const defaultAvatar =
  'https://api.dicebear.com/8.x/initials/svg?backgroundColor=0e1416&fontWeight=700&seed=ChartPilot';

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role?: 'USER' | 'ADMIN' | null;
  status?: 'active' | 'inactive' | 'suspended' | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

const toAppUser = (profile: ProfileRow, fallbackEmail?: string): User => ({
  id: profile.id,
  name: profile.name || fallbackEmail?.split('@')[0] || 'ChartPilot Trader',
  email: profile.email || fallbackEmail || '',
  avatar: profile.avatar_url || `${defaultAvatar}-${profile.id}`,
  role: profile.role || 'USER',
  status: profile.status || 'active',
  lastLoginAt: profile.last_login_at || null,
  createdAt: profile.created_at || null,
});

const assertActiveAccount = async (user: User) => {
  if (user.status === 'active') return user;
  await supabase.auth.signOut();
  throw new Error(`This account is ${user.status}. Please contact support.`);
};

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  if (!session?.user) return null;
  const user = await getOrCreateProfile(session.user.id, session.user.email || '', session.user.user_metadata?.name);
  return assertActiveAccount(user);
}

export async function getOrCreateProfile(userId: string, email: string, name?: string): Promise<User> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id,name,email,avatar_url,role,status,last_login_at,created_at')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return toAppUser(existing, email);

  const profile = {
    id: userId,
    name: name || email.split('@')[0] || 'ChartPilot Trader',
    email,
    avatar_url: `${defaultAvatar}-${userId}`,
    role: 'USER',
    status: 'active',
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select('id,name,email,avatar_url,role,status,last_login_at,created_at')
    .single();

  if (error) throw error;
  return toAppUser(data, email);
}

export async function signInWithPassword(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned from Supabase.');
  const user = await getOrCreateProfile(data.user.id, data.user.email || email, data.user.user_metadata?.name);
  await assertActiveAccount(user);
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);
  return { ...user, lastLoginAt: new Date().toISOString() };
}

export async function signUpWithPassword(email: string, password: string, name: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) throw error;
  if (!data.session || !data.user) return null;
  const user = await getOrCreateProfile(data.user.id, data.user.email || email, name);
  return assertActiveAccount(user);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
