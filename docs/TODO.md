# SveVišnja Kozmetika To-Do List

## Completed Tasks

### Infrastructure & Setup
- [x] **Docker Environment Setup** - Development and production configurations
- [x] **Express Server Setup** - Basic server with health checks and error handling
- [x] **MongoDB Connection** - Atlas integration with environment configuration
- [x] **Database Initialization** - Collections, indexes, and admin user setup
- [x] **Next.js Frontend Setup** - Modern React 19 with Tailwind CSS
- [x] **Environment Configuration** - .env files and Docker integration
- [x] **Project Documentation** - README.md, SETUP.md with comprehensive guides
- [x] **Port Configuration** - Dev alignment (backend 5007, frontend 3001)
- [x] **Seeding Tooling** - env-based seed runner and idempotent mongo-init upsert
- [x] **Postman Collection** - Added collection and tested auth flows

### Backend API
- [x] **User model (Mongoose schemas)** - Complete with validation, security, and methods
- [x] **Product model (Mongoose schemas)** - Comprehensive cosmetics product schema
- [x] **Order model (Mongoose schemas)** - Full order management system
- [x] **Auth routes (register/login)** - Complete authentication system with JWT
- [x] **Products CRUD API** - Complete with pagination, filtering, and search
- [x] **Orders CRUD API** - Full order management system
- [x] **Contact Form API** - Email functionality with validation and rate limiting
- [x] **Database Seeding** - Automated product seeding via mongo-init.js

### Frontend Pages & Components
- [x] **Core UI Components** - Header, Footer, ThemeProvider
- [x] **Site Configuration** - Contact info and branding setup
- [x] **Product Catalog** - Product listing with pagination and search
- [x] **Product Detail Pages** - Comprehensive product pages with SEO
- [x] **Contact Form** - Complete contact form with validation
- [x] **Authentication System** - Login/register pages with AuthContext and real-time validation
- [x] **Error Handling** - Custom 404, error boundaries, global error pages
- [x] **Static Pages** - Policy and Terms pages
- [x] **Gallery Components** - Featured gallery with animations
- [x] **Brand Identity** - Custom favicon, theme colors, visual consistency

### Styling & UI/UX
- [x] **Tailwind CSS Setup** - Complete with custom theme variables
- [x] **Responsive Design** - ProductCard, Pagination, Gallery components
- [x] **Theme System** - CSS custom properties for consistent theming
- [x] **Component Library** - Reusable UI components (DefaultProductImage, etc.)
- [x] **SEO Optimization** - Metadata, structured data, Open Graph tags

## Recently Completed Tasks

### Admin Management System
- [x] **Admin Product Management** - Complete CRUD interface for products
- [x] **Product Form with File Uploads** - Image upload with compression and base64 conversion
- [x] **SKU Generator & Validation** - Automatic SKU generation with duplicate error handling
- [x] **Toast Notification System** - Professional user feedback replacing browser alerts
- [x] **Enhanced Form Validation** - Complete field mapping and error handling
- [x] **Post-Action Navigation** - Proper redirects after CRUD operations

### Backend Enhancements
- [x] **Admin Routes** - Product CRUD APIs with admin authorization
- [x] **Base64 Image Support** - Backend validation for both URLs and base64 data
- [x] **Increased Payload Limits** - Server configuration for large image uploads
- [x] **Enhanced Error Handling** - Specific duplicate key error messages

### Email System
- [x] **Dual SMTP Configuration** - Gmail (primary) and SendPulse (backup) with automatic failover
- [x] **Email Templates** - Welcome, order confirmation, product availability notifications
- [x] **Email Testing Interface** - Admin panel email testing with multiple template types
- [x] **SMTP Error Handling** - Connection timeout fixes and proper error logging

### Navigation & UX Improvements
- [x] **Admin Dropdown Menu** - Organized admin navigation with theme-aware styling
- [x] **Role-based Cart Hiding** - Admin users don't see cart functionality
- [x] **Responsive Mobile Layout** - Dynamic grid layout for different user roles
- [x] **Click-outside Functionality** - Professional dropdown behavior

### Production Deployment
- [x] **Frontend Deployment** - Vercel deployment with proper environment configuration
- [x] **Backend Deployment** - Render deployment with MongoDB Atlas integration
- [x] **CORS Configuration** - Production-ready CORS with Vercel origin support
- [x] **Environment Variables** - Complete production environment setup
- [x] **Database Connection** - MongoDB Atlas network access and connection fixes
- [x] **Live Demo URLs** - Working production deployment with demo credentials

### Documentation
- [x] **Live Demo Section** - README updated with production URLs
- [x] **Demo Login Credentials** - Admin and classic user accounts documented
- [x] **Deployment Configuration** - Complete setup guide for Vercel and Render
- [x] **Root Directory Settings** - Monorepo deployment configuration

### Payments & Checkout
- [x] **Stripe Integration (sandbox/test mode)** - `stripe` SDK on backend, `@stripe/react-stripe-js` + `@stripe/stripe-js` on frontend
- [x] **Payment Controller & Routes** - `paymentController.js` / `routes/payment.js`, mirroring the rest of the API's module structure
- [x] **PaymentIntent Creation API** - Authenticated `/api/payment/create-payment-intent`, verifies order ownership before creating the intent
- [x] **Stripe Webhook Handling** - `/api/payment/webhook` (raw body) handles `payment_intent.succeeded` / `payment_intent.payment_failed`, updates order status and triggers confirmation/failure emails
- [x] **Checkout Flow** - Shipping/billing form → order creation → PaymentIntent → Stripe Elements card form → order confirmation
- [x] **Order History Page** - `/orders` page for logged-in users (list + expandable details, pagination), linked from the header and from the order confirmation page
- [x] **Order Detail Page** - `/orders/[id]` page for logged-in users; fixes the "page not found" previously hit by the "Track Your Order" / "Try Payment Again" links in status/notification emails
- [x] **User Profile Page** - `/profile` page (edit name/phone/preferences, change password), using the pre-existing `/api/auth/profile` and `/api/auth/change-password` endpoints
- [x] **Admin nav cleanup** - Profile/My Orders/Notifications shown only where they apply; My Orders and Notifications hidden for admin accounts (they don't shop), matching the existing cart-hiding pattern
- [x] **Newsletter Sending** - `preferences.newsletter` used to be a stored flag with no functionality behind it; added `/api/newsletter/send` (admin, composes subject + message, sends to all subscribed users via the existing dual-SMTP system), `/admin/newsletter` admin page (Compose / Subscribers / Send History tabs), a new `NewsletterLog` model that persists each send (subject, sender, recipient/success/fail counts), and a working `/unsubscribe` page (the link already existed in the product-availability email template but pointed nowhere)
- [x] **Contact hidden for admin** - `/contact` is a customer-support channel; hidden from the nav for admin accounts, matching the Cart/My Orders/Notifications pattern
- [x] **Newsletter excludes admin accounts** - admin users default to `preferences.newsletter: true` like anyone else, so without a role check they'd show up in the subscriber list and actually receive the newsletter; `sendNewsletter`/`getSubscribers`/`getSubscriberCount` now filter to `role: 'user'`
- [x] **Advanced Product Filtering UI** - `/products` page now has search, category, brand (`GET /api/products/brands` populates the dropdown), min/max price, and sort controls, wired to the query params the API already supported
- [x] **Admin Dashboard** - `/admin` had no page at all (visiting it 404'd); added it plus a new `GET /api/admin/stats` endpoint (total users/products/orders, revenue from completed payments, orders-by-status breakdown, 5 most recent orders, low-stock count)
- [x] **Admin User Management** - `/admin/users` page (search by name/email, filter by role, paginated list) plus `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status` endpoints; role changes and activate/deactivate both guarded so an admin can't change their own role/status or leave the system with zero active admins (deactivating a user reuses the existing `isActive` check in the auth middleware, so it actually blocks login, not just a UI flag)
- [x] **Forgot/Reset Password (end-to-end)** - Found during a full audit against the plan/mentor spec: the login page linked to `/forgot-password`, which didn't exist (404), and the backend's `forgotPassword` controller returned a fake "success" message while leaving a `// TODO: Send password reset email` uncalled. Wired `forgotPassword` to the already-existing `emailService.sendPasswordResetEmail`, and built `/forgot-password` (request the email) and `/reset-password` (set new password via the emailed token, `?token=` read via `useSearchParams` + `Suspense`) pages
- [x] **Product Reviews (submission)** - Product detail page displayed reviews read-only; there was no way to actually leave one, and `documentation.md` referenced a `POST /:id/reviews` route that didn't exist in code. Added `POST /api/products/:id/reviews` (registered users, not admin - reuses the `Product.addReview` pattern, one review per user, auto-sets "Verified Purchase" if the user has a completed-payment order containing the product) and a star-rating + comment form on the product page
- [x] **Payment Retry & Confirm-Result Endpoint** - `/orders/[id]` now offers a "Try Payment Again" flow for orders whose payment previously failed; after `stripe.confirmCardPayment()` resolves in the browser, the frontend reports the outcome to a new `POST /api/payment/confirm-result` endpoint, which independently re-fetches the real status from Stripe (never trusts the client) before applying it. Since the webhook and this endpoint can now both end up handling the same payment outcome, both handlers were made idempotent and wrapped in an in-process lock (`ordersBeingProcessed`) to avoid a Mongoose `ParallelSaveError` from two near-simultaneous saves on the same order

### Slack Notifications
- [x] **Admin Slack Notifications** - New `slackService.js` posts to Slack Incoming Webhooks for new orders, successful/failed payments, and application errors (`SLACK_WEBHOOK_URL` / `SLACK_WEBHOOK_URL_ERRORS`, both optional - the feature is a no-op if unset, and errors fall back to the orders webhook if no dedicated errors webhook is configured)
- [x] **Slack Test Page** - `/admin/slack-test` page plus `POST /api/slack-test/:type` and `GET /api/slack-test/config` endpoints, so the webhook setup can be verified from the admin panel without waiting for a real order/payment/error to trigger one

### SEO & Metadata Overhaul
- [x] **Per-Route Metadata** - Every route used to inherit the same generic metadata from the root layout. Added a shared `lib/metadata.js` helper plus a dedicated `layout.js` per route (title, description, Open Graph, Twitter Card, canonical link), so each page now has its own, unique metadata; `/products/[id]` generates its metadata dynamically from the actual product data via `generateMetadata()`
- [x] **Structured Data (JSON-LD)** - Added Organization and WebSite JSON-LD to the homepage, alongside the pre-existing Product JSON-LD on product pages
- [x] **Dynamic sitemap.js / robots.js** - Replaced with Next.js App Router's native conventions, generated dynamically instead of static files
- [x] **Environment-Gated Indexing** - Only a real production deployment (`NEXT_PUBLIC_NODE_ENV=production`, checked via a new `lib/env.js`) is indexable by search engines; every other environment (local dev, staging) is automatically de-indexed across `robots` metadata, `robots.js`, and `sitemap.js`
- [x] **Server-Side Fetch Fix (Docker)** - `generateMetadata`/`sitemap.js` run inside the frontend's own Docker container, where `localhost` doesn't reach the backend container; added `API_INTERNAL_URL` (Docker service DNS name) and a `getServerApiUrl()` helper so server-side fetches resolve correctly, separate from the browser-facing `NEXT_PUBLIC_API_URL`

### UI/UX Fixes
- [x] **JWT Silent Refresh on Initial Load** - `AuthContext`'s initial session check (`GET /api/auth/me`) now attempts a silent token refresh before treating an expired-but-refreshable session as logged out, matching the recovery `apiCall()` already did for every other protected request
- [x] **Profile Role Translation Fix** - `/profile` was showing the raw, untranslated key `profile.roles.user` instead of a role label (translations object used a mismatched `customer` key against the real `user`/`admin` enum); fixed and aligned the label ("Korisnik") with the existing terminology on `/admin/users`
- [x] **Checkbox Brand Styling** - Checkboxes on `/profile`, `/checkout`, and the admin product form used the browser's default blue accent; now styled with the site's brand color via `accent-color`
- [x] **Order Detail Tracking Form Responsiveness** - The tracking-info form on both the admin and customer-facing order detail pages overflowed its card at narrow/medium widths; switched to a wrapping flex layout and fixed a missing `min-w-0` on the containing grid column

### Internationalization (Serbian/English)
- [x] **Bilingual Content Extraction** - `frontend/src/lib/translations/` (all UI copy) and `backend/src/lib/emailTranslations/` (the 10 transactional email templates in `emailService.js`) were already centralized dictionaries; each was given a full parallel `en` dictionary alongside the existing `sr` one, with automated key-parity and `{placeholder}` checks confirming every key exists in both languages with matching interpolation params, and the existing Serbian content verified byte-identical to before
- [x] **Reactive Language Switching** - Added `contexts/LanguageContext.jsx` (`useTranslation()` hook: `t()`, `plural()`, `language`, `setLanguage()`), mirroring the existing `ThemeProvider` pattern - switching language updates every subscribed component instantly, no page reload. All ~40 client-rendered pages/components that previously called the plain `t()` import now use the hook; a language toggle (SR/EN) sits next to the existing theme toggle in the header, desktop and mobile
- [x] **Serbian/English Pluralization** - `pluralSr()`'s hardcoded per-call word arrays were replaced with a `words` dictionary (Serbian's one/few/many forms vs. English's one/other) and a `plural(wordKey, count)` function, so plural forms follow the active language the same way any other string does
- [x] **Cross-Device Language Preference** - `User.preferences` gained a `language` field (`sr`/`en`, default `sr`); `PUT /api/auth/profile` now merges into `preferences` instead of replacing it wholesale, so setting the language alone no longer clobbers `newsletter`/`notifications`. `LanguageProvider` persists the choice to `localStorage` immediately (like theme) and, once signed in, also syncs it to the account so the same language follows the user across devices; logging in on a device pulls the account's saved language
- [x] **Bilingual Transactional Emails** - `emailService.js` now resolves each recipient's saved language (falling back to the order's populated `user` where the send site doesn't take a `user` param directly, e.g. payment emails) and renders that email's `<html lang>`, date formatting, and copy in Serbian or English accordingly; currency stays RSD in both languages, and the render output was diff-verified byte-identical to the pre-change Serbian version
- [x] **Deliberate non-reactive exceptions** - A handful of places can't reach the language Context and intentionally stay on the plain, Serbian-only `t()` import from `lib/translations`: the ~16 metadata-only route `layout.js` files and the root `layout.js`'s `metadata` object (Next.js reads these on the server, before any Client Component Context exists), `global-error.js` (replaces the entire provider tree on a root-layout crash, so no Context is available), and two fallback error strings in `AuthContext.js` (`LanguageProvider` itself depends on `useAuth()` to sync the signed-in user's language, so `AuthContext` sitting below it in the provider tree can't consume `useTranslation()` without a circular dependency)

## Remaining Tasks

### Backend
- [x] User management API for admin - `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status` added

### Frontend
- [x] **User authentication pages (login, register)** - Complete with AuthContext and form validation
- [x] **Admin panel interface** - Product management system completed
- [x] **Shopping cart and checkout flow** - Cart, checkout form and Stripe payment completed
- [x] **Order history** - `/orders` and `/orders/[id]` pages for logged-in users
- [x] **User profile management** - `/profile` page completed
- [x] **Advanced product filtering UI** - completed, see above
- [x] **Admin dashboard** - completed, see above
- [x] **Admin user management page** - `/admin/users`, completed, see above

### Infrastructure
- [x] **CI/CD pipeline setup** - Auto-deployment on push to main branch
- [x] **Production deployment** - Live on Vercel (frontend) and Render (backend)
- [ ] Performance optimization
- [x] Real-time alerting - Slack notifications for new orders, payment outcomes, and errors, with 60s deduplication and stack trace context for errors (see Slack Notifications above)
- [ ] Persistent/historical monitoring (APM) - the Slack deduplication is in-memory and resets on every redeploy, so there's no error history across restarts, trend view, or performance metrics (response times, throughput)
