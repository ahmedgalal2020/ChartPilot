import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AdminStats, AdminUser, Invoice, Payment, User } from '../types';
import {
  fetchAdminInvoices,
  fetchAdminPayments,
  fetchAdminStats,
  fetchAdminUserDetails,
  fetchAdminUsers,
  sendAdminPasswordReset,
  updateAdminUserStatus,
} from '../services/admin';

type AdminView = 'admin' | 'admin-users' | 'admin-payments' | 'admin-invoices';

interface AdminPanelProps {
  view: AdminView;
  currentUser: User;
  onScreenChange: (screen: string) => void;
  onAddNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type UserDetails = {
  user: AdminUser;
  payments: Payment[];
  invoices: Invoice[];
};

const currency = (value: number, code = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value);

const dateLabel = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never';

const badgeClass = (tone: string) => {
  if (['active', 'paid'].includes(tone)) return 'bg-secondary/10 text-secondary border-secondary/30';
  if (['suspended', 'failed', 'cancelled', 'void'].includes(tone)) return 'bg-error/10 text-error border-error/30';
  if (['trial', 'pending', 'inactive', 'past_due'].includes(tone)) return 'bg-tertiary/10 text-tertiary border-tertiary/30';
  return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
};

const EmptyState = ({ title, body }: { title: string; body: string }) => (
  <div className="border border-dashed border-outline-variant rounded p-8 text-center bg-surface-container-low">
    <p className="text-on-surface font-semibold">{title}</p>
    <p className="text-xs text-on-surface-variant mt-2">{body}</p>
  </div>
);

export default function AdminPanel({ view, currentUser, onScreenChange, onAddNotification }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<UserDetails | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: AdminUser; status: User['status'] } | null>(null);
  const [query, setQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (view === 'admin') setStats(await fetchAdminStats());
      if (view === 'admin-users') setUsers(await fetchAdminUsers());
      if (view === 'admin-payments') setPayments(await fetchAdminPayments());
      if (view === 'admin-invoices') setInvoices(await fetchAdminInvoices());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Admin data could not be loaded.';
      setError(message);
      onAddNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [view]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
      const matchesBilling = billingFilter === 'all' || user.subscriptionStatus === billingFilter;
      return matchesQuery && matchesStatus && matchesBilling;
    });
  }, [users, query, userStatusFilter, billingFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => paymentStatusFilter === 'all' || payment.status === paymentStatusFilter);
  }, [payments, paymentStatusFilter]);

  const openDetails = async (userId: string) => {
    setIsActionLoading(true);
    try {
      setSelectedDetails(await fetchAdminUserDetails(userId));
    } catch (err) {
      onAddNotification(err instanceof Error ? err.message : 'User details could not be loaded.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    try {
      await updateAdminUserStatus(confirmAction.user.id, confirmAction.status);
      setUsers((prev) => prev.map((user) => (
        user.id === confirmAction.user.id ? { ...user, status: confirmAction.status } : user
      )));
      onAddNotification('User account status updated.', 'success');
      setConfirmAction(null);
    } catch (err) {
      onAddNotification(err instanceof Error ? err.message : 'User status could not be updated.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetPassword = async (target: AdminUser) => {
    setIsActionLoading(true);
    try {
      await sendAdminPasswordReset(target.email);
      onAddNotification(`Password reset email sent to ${target.email}.`, 'success');
    } catch (err) {
      onAddNotification(err instanceof Error ? err.message : 'Password reset could not be sent.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const navItem = (target: AdminView, label: string) => (
    <button
      onClick={() => onScreenChange(target)}
      className={`px-3 py-2 rounded text-xs font-semibold border transition-all ${
        view === target
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  );

  const renderOverview = () => {
    if (!stats) return null;
    const cards = [
      { label: 'Registered users', value: stats.totalUsers, icon: Users },
      { label: 'Active users', value: stats.activeUsers, icon: UserCheck },
      { label: 'Paid users', value: stats.paidUsers, icon: CreditCard },
      { label: 'Free users', value: stats.freeUsers, icon: ShieldCheck },
      { label: 'Total payments', value: currency(stats.totalPayments), icon: CreditCard },
      { label: 'Monthly revenue', value: currency(stats.monthlyRevenue), icon: FileText },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="border border-outline-variant bg-surface-container-low rounded p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">{card.label}</p>
                <card.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-on-surface mt-3">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="border border-outline-variant rounded bg-surface-container-low p-4">
            <h3 className="font-bold text-on-surface mb-3">Latest registered users</h3>
            {stats.latestUsers.length ? stats.latestUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-outline-variant/60 last:border-b-0">
                <div>
                  <p className="text-sm text-on-surface font-semibold">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </div>
                <span className={`text-[10px] uppercase px-2 py-1 rounded border ${badgeClass(user.status)}`}>{user.status}</span>
              </div>
            )) : <EmptyState title="No users yet" body="Registered users will appear here." />}
          </div>

          <div className="border border-outline-variant rounded bg-surface-container-low p-4">
            <h3 className="font-bold text-on-surface mb-3">Latest payments</h3>
            {stats.latestPayments.length ? stats.latestPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-outline-variant/60 last:border-b-0">
                <div>
                  <p className="text-sm text-on-surface font-semibold">{payment.userEmail}</p>
                  <p className="text-xs text-on-surface-variant">{dateLabel(payment.createdAt)}</p>
                </div>
                <p className="font-data-mono text-secondary">{currency(payment.amount, payment.currency)}</p>
              </div>
            )) : <EmptyState title="No payments yet" body="Connect Stripe or another provider to populate production payments." />}
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-on-surface-variant" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users by name or email"
            className="w-full bg-surface-container-low border border-outline-variant rounded pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)} className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-xs">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value)} className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-xs">
            <option value="all">All billing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-outline-variant rounded bg-surface-container-low">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Subscription</th>
              <th className="text-left p-3">Registered</th>
              <th className="text-left p-3">Last login</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((item) => (
              <tr key={item.id} className="border-t border-outline-variant/60">
                <td className="p-3">
                  <p className="font-semibold text-on-surface">{item.name}</p>
                  <p className="text-xs text-on-surface-variant">{item.email}</p>
                </td>
                <td className="p-3"><span className="text-xs font-bold">{item.role}</span></td>
                <td className="p-3"><span className={`text-[10px] uppercase px-2 py-1 rounded border ${badgeClass(item.status)}`}>{item.status}</span></td>
                <td className="p-3">
                  <p className="font-semibold">{item.currentPlan}</p>
                  <span className={`text-[10px] uppercase px-2 py-1 rounded border ${badgeClass(item.subscriptionStatus)}`}>{item.subscriptionStatus}</span>
                </td>
                <td className="p-3 text-xs text-on-surface-variant">{dateLabel(item.createdAt)}</td>
                <td className="p-3 text-xs text-on-surface-variant">{dateLabel(item.lastLoginAt)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openDetails(item.id)} className="px-2 py-1 rounded border border-outline-variant hover:border-primary text-xs">View</button>
                    <button onClick={() => resetPassword(item)} className="px-2 py-1 rounded border border-outline-variant hover:border-primary text-xs">Reset</button>
                    {item.status === 'active' ? (
                      <button
                        disabled={item.id === currentUser.id}
                        onClick={() => setConfirmAction({ user: item, status: 'suspended' })}
                        className="px-2 py-1 rounded border border-error/40 text-error hover:bg-error/10 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        title={item.id === currentUser.id ? 'You cannot suspend your own admin account.' : 'Suspend account'}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button onClick={() => setConfirmAction({ user: item, status: 'active' })} className="px-2 py-1 rounded border border-secondary/40 text-secondary hover:bg-secondary/10 text-xs">Reactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredUsers.length && <div className="p-4"><EmptyState title="No users matched" body="Try clearing search or filters." /></div>}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)} className="bg-surface-container-low border border-outline-variant rounded px-3 py-2 text-xs">
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      {filteredPayments.length ? (
        <div className="overflow-x-auto border border-outline-variant rounded bg-surface-container-low">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Customer ID</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-outline-variant/60">
                  <td className="p-3"><p className="font-semibold">{payment.userName}</p><p className="text-xs text-on-surface-variant">{payment.userEmail}</p></td>
                  <td className="p-3 text-xs text-on-surface-variant">{payment.providerCustomerId || 'Not connected'}</td>
                  <td className="p-3 font-data-mono text-secondary">{currency(payment.amount, payment.currency)}</td>
                  <td className="p-3"><span className={`text-[10px] uppercase px-2 py-1 rounded border ${badgeClass(payment.status)}`}>{payment.status}</span></td>
                  <td className="p-3 text-xs text-on-surface-variant">{dateLabel(payment.createdAt)}</td>
                  <td className="p-3">{payment.planName || 'Unknown'}</td>
                  <td className="p-3 text-xs text-on-surface-variant">{payment.providerPaymentId || 'Not connected'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No payments yet" body="Payment records are ready for Stripe or another provider, but no production payments exist yet." />}
    </div>
  );

  const renderInvoices = () => (
    invoices.length ? (
      <div className="overflow-x-auto border border-outline-variant rounded bg-surface-container-low">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Paid</th>
              <th className="text-right p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-outline-variant/60">
                <td className="p-3 font-semibold">{invoice.invoiceNumber}</td>
                <td className="p-3"><p>{invoice.userName}</p><p className="text-xs text-on-surface-variant">{invoice.userEmail}</p></td>
                <td className="p-3 font-data-mono text-secondary">{currency(invoice.amount, invoice.currency)}</td>
                <td className="p-3"><span className={`text-[10px] uppercase px-2 py-1 rounded border ${badgeClass(invoice.status)}`}>{invoice.status}</span></td>
                <td className="p-3 text-xs text-on-surface-variant">{dateLabel(invoice.createdAt)}</td>
                <td className="p-3 text-xs text-on-surface-variant">{dateLabel(invoice.paidAt)}</td>
                <td className="p-3 text-right">{invoice.invoiceUrl ? <a className="text-primary underline" href={invoice.invoiceUrl} target="_blank" rel="noreferrer">Open</a> : 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : <EmptyState title="No invoices yet" body="Invoices will appear here after a payment provider is connected." />
  );

  return (
    <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 text-on-surface">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary font-bold">Admin control</p>
            <h1 className="text-2xl font-bold mt-1">ChartPilot Admin Panel</h1>
            <p className="text-sm text-on-surface-variant mt-1">Monitor users, billing records, and account access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {navItem('admin', 'Overview')}
            {navItem('admin-users', 'Users')}
            {navItem('admin-payments', 'Payments')}
            {navItem('admin-invoices', 'Invoices')}
            <button onClick={loadAdminData} className="px-3 py-2 rounded border border-outline-variant text-xs font-semibold hover:border-primary flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-error/35 bg-error/10 text-error rounded p-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[360px] flex items-center justify-center text-primary font-mono uppercase tracking-widest text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading admin data...
          </div>
        ) : (
          <>
            {view === 'admin' && renderOverview()}
            {view === 'admin-users' && renderUsers()}
            {view === 'admin-payments' && renderPayments()}
            {view === 'admin-invoices' && renderInvoices()}
          </>
        )}
      </div>

      {selectedDetails && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-container border border-outline-variant rounded shadow-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{selectedDetails.user.name}</h2>
                <p className="text-sm text-on-surface-variant">{selectedDetails.user.email}</p>
              </div>
              <button onClick={() => setSelectedDetails(null)} className="px-3 py-1 rounded border border-outline-variant text-xs">Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-surface-container-low border border-outline-variant rounded p-3"><p className="text-xs text-on-surface-variant">Role</p><p className="font-bold">{selectedDetails.user.role}</p></div>
              <div className="bg-surface-container-low border border-outline-variant rounded p-3"><p className="text-xs text-on-surface-variant">Status</p><p className="font-bold">{selectedDetails.user.status}</p></div>
              <div className="bg-surface-container-low border border-outline-variant rounded p-3"><p className="text-xs text-on-surface-variant">Plan</p><p className="font-bold">{selectedDetails.user.currentPlan}</p></div>
              <div className="bg-surface-container-low border border-outline-variant rounded p-3"><p className="text-xs text-on-surface-variant">Last login</p><p className="font-bold">{dateLabel(selectedDetails.user.lastLoginAt)}</p></div>
            </div>
            <div className="mt-4">
              <h3 className="font-bold mb-2">Payment history summary</h3>
              <p className="text-sm text-on-surface-variant">
                {selectedDetails.payments.length
                  ? `${selectedDetails.payments.length} payment records, total ${currency(selectedDetails.payments.reduce((sum, item) => sum + item.amount, 0))}.`
                  : 'No payments recorded for this user.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded shadow-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-tertiary shrink-0 mt-1" />
              <div>
                <h2 className="font-bold">Confirm account status change</h2>
                <p className="text-sm text-on-surface-variant mt-2">
                  Change {confirmAction.user.email} to {confirmAction.status}? This affects their ability to use the platform.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-2 rounded border border-outline-variant text-xs">Cancel</button>
              <button disabled={isActionLoading} onClick={confirmStatusChange} className="px-3 py-2 rounded bg-primary text-on-primary text-xs font-bold disabled:opacity-50">
                {isActionLoading ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
