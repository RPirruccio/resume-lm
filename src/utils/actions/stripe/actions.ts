'use server';

// This file has been modified to remove Stripe integration
// for a local-only, open-source version of the application.
// All users are considered to have full access.

import { createClient } from '@/utils/supabase/server'; // Keep for auth
// import { Subscription } from '@/lib/types'; // May not be needed if Subscription type is Stripe-specific
// import { revalidatePath } from "next/cache"; // Keep if any function uses it, may not be needed

/**
 * Helper to get subscription status.
 * In this local version, always returns a default active "free" plan status,
 * implying full access to features.
 */
export async function getSubscriptionStatus() {
  console.log('STRIPE_ACTIONS: getSubscriptionStatus called (local mode - returning default full access)');
  return {
    subscription_plan: 'free', // Represents full access in local mode
    subscription_status: 'active',
    current_period_end: null,
    trial_end: null,
    stripe_customer_id: null,
    stripe_subscription_id: null
  };
}

/**
 * Checks subscription plan.
 * In this local version, always returns a default active "free" plan status.
 */
export async function checkSubscriptionPlan() {
  console.log('STRIPE_ACTIONS: checkSubscriptionPlan called (local mode - returning default full access)');
  return {
    plan: 'free', // Represents full access in local mode
    status: 'active',
    currentPeriodEnd: '' // Or null, consistent with getSubscriptionStatus
  };
}

/**
 * Gets the subscription plan.
 * In this local version, always returns a default "free" plan.
 * If returnId is true, it attempts to return the current user's ID.
 */
export async function getSubscriptionPlan(returnId?: boolean) {
  console.log('STRIPE_ACTIONS: getSubscriptionPlan called (local mode - returning default full access)');
  if (returnId) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return {
        plan: 'free', // Represents full access in local mode
        id: user?.id || ''
      };
    } catch (error) {
      console.error("Error fetching user for getSubscriptionPlan with returnId:", error);
      return {
        plan: 'free',
        id: ''
      };
    }
  }
  return 'free'; // Represents full access in local mode
}

// The following Stripe-related functions have been removed as they are
// not applicable to a local-only, non-commercial version:
// - createOrRetrieveCustomer
// - createCustomerInStripe
// - upsertCustomerToSupabase
// - manageSubscriptionStatusChange
// - deleteCustomerAndData
// - createCheckoutSession
// - cancelSubscription
// - toggleSubscriptionPlan

// If any components were calling, for example, `cancelSubscription` and expecting
// path revalidation, those components or their calls will need to be removed or refactored
// as part of the UI cleanup phase.
