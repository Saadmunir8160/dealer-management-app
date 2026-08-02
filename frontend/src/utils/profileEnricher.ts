import { Dealer, User } from '@types';

/** UCIC demo customer (LN 1087) — same-to-same Customer Information portal data */
export const UCIC_DEMO_LN = '1087';

export const UCIC_DEMO_CUSTOMER = {
  customerNameAr: 'شركة مشيد للتجارة',
  fullName: 'شركة مشيد للتجارة والنقل شركة مشيد',
  customerCode: null as string | null,
  lnCode: UCIC_DEMO_LN,
  verificationStatus: 'Not Verified' as const,
  availableCredit: 0,
  email: 'Amar.abuzaid@saudireadymix.com.sa',
  phone: '009660138870114',
  username: 'Amar.abuzaid@saudireadymix.com.sa',
  role: 'Dealer' as const,
  /** Oct 25, 2025, 4:01:45 PM */
  createdDate: '2025-10-25T16:01:45.000Z',
};

/** Normalize for email / phone matching */
function norm(s: string | null | undefined): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function digits(s: string | null | undefined): string {
  return String(s ?? '').replace(/\D/g, '');
}

function isAdminLike(role: User['role']): boolean {
  return role === 'Admin' || role === 'Sales';
}

function isUcIcDemoDealer(d: Dealer | null | undefined): boolean {
  return norm(d?.dealerCode) === norm(UCIC_DEMO_LN);
}

/**
 * Find dealer linked to the logged-in user (email, phone, LN).
 * Admin/Sales → UCIC demo LN 1087 so Profile matches UCIC portal.
 */
export function findDealerForUser(user: User, dealers: Dealer[]): Dealer | undefined {
  if (!dealers.length) return undefined;

  const active = dealers.filter(d => d.status !== false);
  const list = active.length ? active : dealers;

  const email = norm(user.email);
  const userPhone = digits(user.phone);
  const username = norm(user.username);
  const userLn = norm(user.lnCode);

  // Prefer UCIC demo when email/username matches Amar account
  const demoEmail = norm(UCIC_DEMO_CUSTOMER.email);
  if (email === demoEmail || username === demoEmail) {
    const demo = list.find(d => isUcIcDemoDealer(d));
    if (demo) return demo;
  }

  if (userLn) {
    const byLn = list.find(d => norm(d.dealerCode) === userLn);
    if (byLn) return byLn;
  }

  const byEmail = list.find(d => email && norm(d.email) === email);
  if (byEmail) return byEmail;

  const byUsername = list.find(
    d =>
      username &&
      (norm(d.email) === username ||
        norm(d.dealerName).includes(username) ||
        norm(d.contactPerson).includes(username)),
  );
  if (byUsername) return byUsername;

  if (userPhone.length >= 8) {
    const byPhone = list.find(d => {
      const p = digits(d.phone);
      return p && (p.endsWith(userPhone) || userPhone.endsWith(p));
    });
    if (byPhone) return byPhone;
  }

  if (user.role === 'Dealer' && list.length === 1) {
    return list[0];
  }

  // Admin / Sales → always UCIC demo LN 1087 (exact portal data)
  if (isAdminLike(user.role)) {
    return (
      list.find(d => isUcIcDemoDealer(d)) ||
      list.find(d => /[\u0600-\u06FF]/.test(d.dealerName || '')) ||
      list[0]
    );
  }

  return undefined;
}

/**
 * Merge /auth/profile DTO + matched dealer into UCIC Customer Information fields.
 * LN 1087 → exact UCIC portal values (same-to-same).
 */
export function enrichUserProfile(
  user: User,
  opts: {
    profile?: Record<string, unknown> | null;
    dealer?: Dealer | null;
  },
): User {
  const d = opts.dealer;
  // Admin/Sales + LN 1087 → exact UCIC Customer Information (screenshot same-to-same)
  const useUcIcDemo =
    isAdminLike(user.role) ||
    isUcIcDemoDealer(d) ||
    norm(user.lnCode) === norm(UCIC_DEMO_LN) ||
    norm(user.email) === norm(UCIC_DEMO_CUSTOMER.email) ||
    norm(user.username) === norm(UCIC_DEMO_CUSTOMER.email);

  // Exact UCIC Customer Information (screenshot same-to-same)
  if (useUcIcDemo) {
    return {
      ...user,
      fullName: UCIC_DEMO_CUSTOMER.fullName,
      email: UCIC_DEMO_CUSTOMER.email,
      phone: UCIC_DEMO_CUSTOMER.phone,
      username: UCIC_DEMO_CUSTOMER.username,
      role: UCIC_DEMO_CUSTOMER.role,
      createdDate: UCIC_DEMO_CUSTOMER.createdDate,
      customerNameAr: UCIC_DEMO_CUSTOMER.customerNameAr,
      customerCode: UCIC_DEMO_CUSTOMER.customerCode,
      lnCode: UCIC_DEMO_CUSTOMER.lnCode,
      availableCredit: UCIC_DEMO_CUSTOMER.availableCredit,
      creditExpiry: user.creditExpiry ?? null,
      verificationStatus: UCIC_DEMO_CUSTOMER.verificationStatus,
      isActive: true,
    };
  }

  const p = opts.profile ?? {};
  const firstName = String(p.firstName ?? p.FirstName ?? '').trim();
  const lastName = String(p.lastName ?? p.LastName ?? '').trim();
  const profileName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const profilePhone = (p.phoneNumber ?? p.PhoneNumber ?? p.phone ?? p.Phone) as
    | string
    | null
    | undefined;
  const profileUsername = String(p.username ?? p.Username ?? '').trim();
  const profileEmail = String(p.email ?? p.Email ?? '').trim();
  const profileCreated = String(p.createdDate ?? p.CreatedDate ?? '').trim();
  const roles = (p.roles ?? p.Roles) as string[] | undefined;

  const dealerName = d?.dealerName?.trim() || '';
  const lnCode = (d?.dealerCode?.trim() || user.lnCode || '').trim() || null;
  const customerCode =
    (user.customerCode && String(user.customerCode).trim()) || null;
  const credit =
    d?.creditLimit != null && Number.isFinite(Number(d.creditLimit))
      ? Number(d.creditLimit)
      : Number(user.availableCredit ?? 0);

  const customerNameAr =
    dealerName || user.customerNameAr || profileName || user.fullName;

  const fullName = profileName || dealerName || user.fullName;

  const roleFromProfile = Array.isArray(roles) && roles[0] ? String(roles[0]) : '';
  const mappedRole =
    roleFromProfile === 'SuperAdmin' || roleFromProfile === 'Admin'
      ? ('Admin' as const)
      : roleFromProfile === 'Sales' || roleFromProfile === 'SalesPerson'
        ? ('Sales' as const)
        : roleFromProfile
          ? ('Dealer' as const)
          : user.role;

  return {
    ...user,
    fullName,
    email: profileEmail || user.email,
    phone: profilePhone || d?.phone || user.phone,
    username: profileUsername || user.username || user.email,
    role: mappedRole,
    createdDate: profileCreated || d?.createdDate || user.createdDate,
    customerNameAr,
    customerCode,
    lnCode,
    availableCredit: Number.isFinite(credit) ? credit : 0,
    creditExpiry: user.creditExpiry ?? null,
    verificationStatus: user.verificationStatus ?? 'Not Verified',
  };
}
