'use server';

import { Stripe } from "stripe";
import { createClient, createServiceClient } from '@/utils/supabase/server';
import { Subscription } from '@/lib/types';
import { revalidatePath } from "next/cache";

// Initialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// Create or retrieve a Stripe customer
export async function createOrRetrieveCustomer({
  uuid,
  email
}: {
  uuid: string;
  email: string;
}): Promise<string> {
  const supabase = await createServiceClient();

  // First check if user has a subscription record with stripe_customer_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', uuid)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // If no customer exists, create one
  const customerID = await createCustomerInStripe(uuid, email);
  await upsertCustomerToSupabase(uuid, customerID);
  
  return customerID;
}

// Create a new customer in Stripe
async function createCustomerInStripe(uuid: string, email: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabaseUUID: uuid
    }
  });
  return customer.id;
}

// Update or insert customer info in Supabase
async function upsertCustomerToSupabase(uuid: string, customerId: string) {
  const supabase = await createServiceClient();

  // Update or create subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: uuid,
      stripe_customer_id: customerId,
      subscription_plan: 'free',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    });

  if (subscriptionError) throw subscriptionError;
}

// Manage subscription status change
export async function manageSubscriptionStatusChange(
  subscriptionId: string,
  customerId: string,
  isSubscriptionNew: boolean
) {
  console.log('\n🔄 Starting subscription status change...');
  console.log('📝 Input Data:', {
    subscriptionId,
    customerId,
    isSubscriptionNew
  });

  const supabase = await createServiceClient();

  // Get customer's UUID from Stripe metadata
  const customerData = await stripe.customers.retrieve(customerId);
  if ('deleted' in customerData) {
    console.error('\n❌ Customer has been deleted');
    throw new Error('Customer has been deleted');
  }
  const uuid = customerData.metadata.supabaseUUID;
  console.log('\n👤 Retrieved customer UUID:', uuid);

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'items.data.price']
  });
  console.log('\n📦 Retrieved Stripe subscription:', {
    id: subscription.id,
    status: subscription.status,
    currentPeriod: {
      start: new Date(subscription.current_period_start * 1000),
      end: new Date(subscription.current_period_end * 1000)
    },
    priceId: subscription.items.data[0].price.id
  });

  // Map price ID to plan
  const priceIdToPlan: Record<string, 'free' | 'pro'> = {
    'price_1QiNgyCv6RlaQFiM9CI8wPgA': 'pro'
  };
  const plan = priceIdToPlan[subscription.items.data[0].price.id] || 'free';

  // Prepare subscription data
  const subscriptionData: Partial<Subscription> = {
    user_id: uuid,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    subscription_plan: plan,
    subscription_status: subscription.cancel_at_period_end ? 'canceled' : subscription.status === 'active' ? 'active' : 'canceled',
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString()
  };
  console.log('\n📋 Prepared subscription data:', subscriptionData);

  try {
    // First try to update existing subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', uuid)
      .single();

    if (existingSubscription) {
      console.log('\n🔄 Updating existing subscription:', existingSubscription.id);
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', uuid);

      if (error) {
        console.error('\n❌ Error updating subscription:', error);
        throw error;
      }
      console.log('✅ Subscription updated successfully');
    } else {
      console.log('\n🔄 Upserting subscription record');
      // Upsert subscription data
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          { 
            ...subscriptionData, 
            created_at: new Date().toISOString() 
          },
          { 
            onConflict: 'user_id',  // This is the unique constraint column
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error('\n❌ Error upserting subscription:', error);
        throw error;
      }
      console.log('✅ Subscription upserted successfully');
    }

    console.log('\n🎉 Subscription management completed successfully!\n');

  } catch (error) {
    console.error('\n💥 Error managing subscription:', error);
    throw error;
  }
}

// Delete customer
export async function deleteCustomerAndData(uuid: string) {
  const supabase = await createServiceClient();

  // Get Stripe customer ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', uuid)
    .single();

  if (subscription?.stripe_customer_id) {
    // Delete customer in Stripe
    await stripe.customers.del(subscription.stripe_customer_id);
  }

  // Delete subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', uuid);

  if (subscriptionError) throw subscriptionError;
}

// Helper to get subscription status
export async function getSubscriptionStatus() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select(`
      subscription_plan,
      subscription_status,
      current_period_end,
      trial_end,
      stripe_customer_id,
      stripe_subscription_id
    `)
    .eq('user_id', user.id)
    .single();

  if (subscriptionError) {
    // If no subscription found, return a default free plan instead of throwing
    void subscriptionError
    if (subscriptionError.code === 'PGRST116') {
      return {
        subscription_plan: 'Free',
        subscription_status: 'active',
        current_period_end: null,
        trial_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null
      };
    }
    throw new Error('Failed to fetch subscription status');
  }

  return subscription;
}



export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId: user.id,
      email: user.email,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { sessionId } = await response.json();
  return { sessionId };
}

export async function cancelSubscription() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch('/api/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.id,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel subscription');
  }

  // Update the profile subscription status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
    })
    .eq('user_id', user.id);

  if (updateError) {
    throw new Error('Failed to update subscription status');
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings', 'layout');
  revalidatePath('/plans', 'layout');
}

export async function checkSubscriptionPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { plan: '', status: '', currentPeriodEnd: '' };

  const { data } = await supabase
    .from('subscriptions')
    .select('subscription_plan, subscription_status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    plan: data?.subscription_plan || '',
    status: data?.subscription_status || '',
    currentPeriodEnd: data?.current_period_end || ''
  };
}

export async function getSubscriptionPlan(returnId?: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return '';

  const { data } = await supabase
    .from('subscriptions')
    .select('subscription_plan')
    .eq('user_id', user.id)
    .maybeSingle();

  if (returnId) {
    return {
      plan: data?.subscription_plan || '',
      id: user.id || ''
    };
  }

  return data?.subscription_plan || '';
}

export async function toggleSubscriptionPlan(newPlan: 'free' | 'pro'): Promise<'free' | 'pro'> {
  
  const supabase = await createServiceClient();
  


  try {

    // Upsert the new plan
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: "db2686c0-2003-4c90-87b0-cbc20e9d6b3c",
        subscription_plan: newPlan,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      throw new Error('Failed to update subscription');
    }

    revalidatePath('/');
    return newPlan;
  } catch (error) {
    console.error('Subscription toggle error:', error);
    throw new Error('Failed to toggle subscription plan');
  }
}
