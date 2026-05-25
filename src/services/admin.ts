import { supabase } from '../lib/supabase';
import type { AdminStats, AdminUser, Invoice, Payment, Subscription, User } from '../types';

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string | null;
  last_login_at: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_name: string;
  status: Subscription['status'];
  current_period_start: string | null;
  current_period_end: string | null;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
};

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number | string;
  currency: string;
  status: Payment['status'];
  provider: string | null;
  provider_payment_id: string | null;
  plan_name: string | null;
  invoice_url: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  user_id: string;
  invoice_number: string;
  amount: number | string;
  currency: string;
  status: Invoice['status'];
  invoice_url: string | null;
  created_at: string;
  paid_at: string | null;
};

const fallbackAvatar = (id: string) =>
  `https://api.dicebear.com/8.x/initials/svg?backgroundColor=0e1416&fontWeight=700&seed=${id}`;

const toUser = (profile: ProfileRow): User => ({
  id: profile.id,
  name: profile.name || profile.email?.split('@')[0] || 'ChartPilot Trader',
  email: profile.email || '',
  avatar: profile.avatar_url || fallbackAvatar(profile.id),
  role: profile.role,
  status: profile.status,
  createdAt: profile.created_at,
  lastLoginAt: profile.last_login_at,
});

const subscriptionByUser = (subscriptions: SubscriptionRow[]) =>
  subscriptions.reduce<Record<string, SubscriptionRow>>((acc, subscription) => {
    acc[subscription.user_id] = subscription;
    return acc;
  }, {});

const profileByUser = (profiles: ProfileRow[]) =>
  profiles.reduce<Record<string, ProfileRow>>((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

const toAdminUser = (profile: ProfileRow, subscription?: SubscriptionRow): AdminUser => ({
  ...toUser(profile),
  subscriptionStatus: subscription?.status || 'free',
  currentPlan: subscription?.plan_name || 'Free',
  providerCustomerId: subscription?.provider_customer_id || null,
});

const toPayment = (payment: PaymentRow, profile?: ProfileRow, subscription?: SubscriptionRow): Payment => ({
  id: payment.id,
  userId: payment.user_id,
  userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown user',
  userEmail: profile?.email || '',
  amount: Number(payment.amount || 0),
  currency: payment.currency,
  status: payment.status,
  provider: payment.provider,
  providerPaymentId: payment.provider_payment_id,
  providerCustomerId: subscription?.provider_customer_id || null,
  planName: payment.plan_name || subscription?.plan_name || null,
  invoiceUrl: payment.invoice_url,
  createdAt: payment.created_at,
});

const toInvoice = (invoice: InvoiceRow, profile?: ProfileRow): Invoice => ({
  id: invoice.id,
  userId: invoice.user_id,
  userName: profile?.name || profile?.email?.split('@')[0] || 'Unknown user',
  userEmail: profile?.email || '',
  invoiceNumber: invoice.invoice_number,
  amount: Number(invoice.amount || 0),
  currency: invoice.currency,
  status: invoice.status,
  invoiceUrl: invoice.invoice_url,
  createdAt: invoice.created_at,
  paidAt: invoice.paid_at,
});

export async function assertAdmin(): Promise<User> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const sessionUser = sessionData.session?.user;
  if (!sessionUser) throw new Error('Admin access requires a signed-in account.');

  const { data: allowed, error: rpcError } = await supabase.rpc('is_admin', {
    check_user_id: sessionUser.id,
  });
  if (rpcError) throw rpcError;
  if (!allowed) throw new Error('You do not have access to the admin panel.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,email,avatar_url,role,status,created_at,last_login_at')
    .eq('id', sessionUser.id)
    .single();
  if (profileError) throw profileError;
  return toUser(profile as ProfileRow);
}

async function fetchAdminSourceData() {
  await assertAdmin();

  const [profilesResponse, subscriptionsResponse, paymentsResponse, invoicesResponse] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,name,email,avatar_url,role,status,created_at,last_login_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('id,user_id,plan_name,status,current_period_start,current_period_end,provider,provider_customer_id,provider_subscription_id'),
    supabase
      .from('payments')
      .select('id,user_id,amount,currency,status,provider,provider_payment_id,plan_name,invoice_url,created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id,user_id,invoice_number,amount,currency,status,invoice_url,created_at,paid_at')
      .order('created_at', { ascending: false }),
  ]);

  if (profilesResponse.error) throw profilesResponse.error;
  if (subscriptionsResponse.error) throw subscriptionsResponse.error;
  if (paymentsResponse.error) throw paymentsResponse.error;
  if (invoicesResponse.error) throw invoicesResponse.error;

  const profiles = (profilesResponse.data || []) as ProfileRow[];
  const subscriptions = (subscriptionsResponse.data || []) as SubscriptionRow[];
  const payments = (paymentsResponse.data || []) as PaymentRow[];
  const invoices = (invoicesResponse.data || []) as InvoiceRow[];

  return { profiles, subscriptions, payments, invoices };
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { profiles, subscriptions, payments } = await fetchAdminSourceData();
  const subscriptionsByUser = subscriptionByUser(subscriptions);
  const profilesByUser = profileByUser(profiles);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const paidPayments = payments.filter((payment) => payment.status === 'paid');

  return {
    totalUsers: profiles.length,
    activeUsers: profiles.filter((profile) => profile.status === 'active').length,
    paidUsers: subscriptions.filter((subscription) => subscription.status === 'paid').length,
    freeUsers: profiles.filter((profile) => subscriptionsByUser[profile.id]?.status !== 'paid').length,
    totalPayments: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    monthlyRevenue: paidPayments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.created_at);
      if (paymentDate.getMonth() !== currentMonth || paymentDate.getFullYear() !== currentYear) return sum;
      return sum + Number(payment.amount || 0);
    }, 0),
    latestUsers: profiles.slice(0, 5).map((profile) => toAdminUser(profile, subscriptionsByUser[profile.id])),
    latestPayments: paidPayments
      .slice(0, 5)
      .map((payment) => toPayment(payment, profilesByUser[payment.user_id], subscriptionsByUser[payment.user_id])),
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { profiles, subscriptions } = await fetchAdminSourceData();
  const subscriptionsByUser = subscriptionByUser(subscriptions);
  return profiles.map((profile) => toAdminUser(profile, subscriptionsByUser[profile.id]));
}

export async function fetchAdminUserDetails(userId: string) {
  const { profiles, subscriptions, payments, invoices } = await fetchAdminSourceData();
  const profile = profiles.find((item) => item.id === userId);
  if (!profile) throw new Error('User was not found.');
  const subscriptionsByUser = subscriptionByUser(subscriptions);
  const profilesByUser = profileByUser(profiles);

  return {
    user: toAdminUser(profile, subscriptionsByUser[userId]),
    payments: payments
      .filter((payment) => payment.user_id === userId)
      .map((payment) => toPayment(payment, profilesByUser[userId], subscriptionsByUser[userId])),
    invoices: invoices
      .filter((invoice) => invoice.user_id === userId)
      .map((invoice) => toInvoice(invoice, profilesByUser[userId])),
  };
}

export async function updateAdminUserStatus(userId: string, status: User['status']): Promise<void> {
  const currentAdmin = await assertAdmin();
  if (currentAdmin.id === userId && status !== 'active') {
    throw new Error('You cannot deactivate your own admin account.');
  }

  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('id,role,status')
    .eq('id', userId)
    .single();
  if (targetError) throw targetError;

  if (target?.role === 'ADMIN' && status !== 'active') {
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .eq('status', 'active');
    if (adminsError) throw adminsError;
    if ((admins || []).length <= 1) {
      throw new Error('You cannot deactivate the last active admin.');
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  await assertAdmin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export async function fetchAdminPayments(): Promise<Payment[]> {
  const { profiles, subscriptions, payments } = await fetchAdminSourceData();
  const profilesByUser = profileByUser(profiles);
  const subscriptionsByUser = subscriptionByUser(subscriptions);
  return payments.map((payment) => toPayment(payment, profilesByUser[payment.user_id], subscriptionsByUser[payment.user_id]));
}

export async function fetchAdminInvoices(): Promise<Invoice[]> {
  const { profiles, invoices } = await fetchAdminSourceData();
  const profilesByUser = profileByUser(profiles);
  return invoices.map((invoice) => toInvoice(invoice, profilesByUser[invoice.user_id]));
}
