import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || 'ChartPilot Admin';

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, or ADMIN_PASSWORD.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const existingUser = await findUserByEmail(adminEmail);
  let adminUser = existingUser;

  if (!adminUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: adminName },
    });
    if (error) throw error;
    adminUser = data.user;
  }

  if (!adminUser?.id) throw new Error('Supabase did not return an admin user id.');

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminUser.id,
      name: adminName,
      email: adminEmail,
      avatar_url: `https://api.dicebear.com/8.x/initials/svg?backgroundColor=0e1416&fontWeight=700&seed=${encodeURIComponent(adminName)}`,
      role: 'ADMIN',
      status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (profileError) throw profileError;
  console.log(existingUser ? 'Admin account already existed; profile role refreshed.' : 'Admin account created.');
  console.log(`Admin email: ${adminEmail}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
