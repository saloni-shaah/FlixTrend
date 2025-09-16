import { supabase } from "./supabaseClient";

export async function signUpWithEmail({ email, password, phone }: { email: string; password: string; phone?: string }) {
  return await supabase.auth.signUp({
    email,
    password,
    phone,
  });
}

export async function signInWithEmail({ email, password }: { email: string; password: string }) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
} 