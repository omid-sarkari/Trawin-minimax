import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type SignupRole = 'developer' | 'company';

export function resolveDashboardPath(role?: string | null, email?: string | null): string {
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (email && adminEmails.includes(email.toLowerCase())) return '/admin';
  switch (role) {
    case 'company':
      return '/company';
    case 'admin':
      return '/admin';
    default:
      return '/dashboard';
  }
}

export class AuthService {
  private supabase = createClient();

  async signUp(
    email: string,
    password: string,
    fullName: string,
    options: { role?: SignupRole; companyName?: string } = {}
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: options.role ?? 'developer',
          company_name: options.companyName ?? null,
        },
      },
    });

    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        throw new Error('این ایمیل قبلاً ثبت شده است. وارد شوید یا ایمیل دیگری امتحان کنید.');
      }
      throw new Error(error.message);
    }

    // وقتی تأیید ایمیل فعال است، Supabase برای ایمیل تکراری «موفقیت» برمی‌گرداند؛
    // نشانه واقعی تکراری بودن: identities خالی
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('این ایمیل قبلاً ثبت شده است. اگر حساب دارید وارد شوید یا رمز عبور را بازیابی کنید.');
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    return data;
  }

  async resolveRole(email?: string | null): Promise<string> {
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (email && adminEmails.includes(email.toLowerCase())) return 'admin';

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    const metaRole = user?.user_metadata?.role;
    if (typeof metaRole === 'string' && metaRole) return metaRole;

    if (user) {
      const { data: row } = await this.supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (row?.role) return row.role as string;
    }
    return 'developer';
  }

  /**
   * Canonical Trawin application user id (public.users.id) for the signed-in
   * auth identity. Application tables reference this id, NOT auth.users.id.
   */
  async getAppUserId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('get_my_user_id');
    if (error) throw new Error(`get_my_user_id failed: ${error.message}`);
    return data as string;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/update-password`
          : undefined,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}
