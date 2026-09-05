// Site navigation structure - routes and translation keys, independent of
// language. Header.jsx resolves the label text via t(labelKey) at render time.

export const NAV_LINKS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/products', labelKey: 'nav.products' },
];

// Admins don't need this any more than a cart or order history (see USER_NAV_LINKS)
export const CONTACT_NAV_LINK = { href: '/contact', labelKey: 'nav.contact' };

// Every authenticated user, admin included - account-level, not shopping-related
export const ACCOUNT_NAV_LINKS = [
  { href: '/profile', labelKey: 'nav.profile' },
];

// Customers only - admins don't shop, so no cart, orders, or notifications for them
export const USER_NAV_LINKS = [
  { href: '/orders', labelKey: 'nav.myOrders' },
  { href: '/notifications', labelKey: 'nav.notifications' },
];

export const ADMIN_NAV_LINKS = [
  { href: '/admin', labelKey: 'nav.adminDashboard' },
  { href: '/admin/products', labelKey: 'nav.adminManageProducts' },
  { href: '/admin/orders', labelKey: 'nav.adminManageOrders' },
  { href: '/admin/users', labelKey: 'nav.adminUsers' },
  { href: '/admin/newsletter', labelKey: 'nav.adminNewsletter' },
  { href: '/admin/email-test', labelKey: 'nav.adminEmailTest' },
];
