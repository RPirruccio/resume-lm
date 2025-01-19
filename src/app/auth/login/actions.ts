'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface AuthResult {
  success: boolean;
  error?: string;
}

interface GithubAuthResult extends AuthResult {
  url?: string;
}

interface StripeCustomerUpdate {
  success: boolean;
  error?: string;
}

// Login
export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/')
  return { success: true }
}

// Signup
export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('name') as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
    }
  }

  const { error: signupError } = await supabase.auth.signUp(data)

  if (signupError) {
    return { success: false, error: signupError.message }
  }

  return { success: true }
} 

// Logout 
export async function logout() {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Always redirect to login, even if there was an error
  redirect('/auth/login');
} 

// Password Reset
export async function resetPasswordForEmail(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
} 

// Waitlist Signup
export async function joinWaitlist(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    first_name: formData.get('firstName') as string,
    last_name: formData.get('lastName') as string,
  };

  console.log('Attempting to join waitlist with data:', data);

  try {
    const { error } = await supabase
      .from('mailing-list')
      .insert([data]);

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error: error.message };
    }

    console.log('Successfully joined waitlist');
    return { success: true };
  } catch (e) {
    console.error('Unexpected error during waitlist signup:', e);
    return { 
      success: false, 
      error: e instanceof Error ? e.message : 'An unexpected error occurred' 
    };
  }
} 

// GitHub Sign In
export async function signInWithGithub(): Promise<GithubAuthResult> {
  console.log('🔐 Server: Starting GitHub OAuth process');
  const supabase = await createClient();

  try {
    console.log('🔑 Server: Initiating Supabase OAuth with GitHub');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          next: '/'
        }
      }
    });

    if (error) {
      console.error('❌ Server: Supabase OAuth error:', error);
      return { success: false, error: error.message };
    }

    console.log('📤 Server: Received OAuth response:', { url: data?.url });
    if (data?.url) {
      console.log('✅ Server: Successfully got OAuth URL');
      return { success: true, url: data.url };
    }

    console.error('❌ Server: No OAuth URL received');
    return { success: false, error: 'Failed to get OAuth URL' };
  } catch (error) {
    console.error('💥 Server: Unexpected error during GitHub sign in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
} 

// Check if user is authenticated
export async function checkAuth(): Promise<{ 
  authenticated: boolean; 
  user?: { id: string; email?: string } | null 
}> {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Auth check error:', error);
      return { authenticated: false };
    }

    return { 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Unexpected error during auth check:', error);
    return { authenticated: false };
  }
} 

// Get user ID if authenticated
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
} 

// New function to check subscription status
export async function getSubscriptionStatus(): Promise<{
  hasSubscription: boolean;
  plan?: string;
  status?: string;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    const userId = await getUserId();
    if (!userId) {
      return { hasSubscription: false, error: 'No authenticated user' };
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('subscription_plan, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return { hasSubscription: false, error: error.message };
    }

    return {
      hasSubscription: !!subscription,
      plan: subscription?.subscription_plan,
      status: subscription?.subscription_status
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { 
      hasSubscription: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 
