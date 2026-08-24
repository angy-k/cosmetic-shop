# Cosmetic Shop – Project Specification

## 1. Introduction
The **Cosmetic Shop** project is a full-stack web application designed to provide users with an interactive online platform for browsing, ordering, and managing cosmetic products.  
The application includes user authentication, an administrative dashboard, and automated email notifications for orders and product availability.

---

## 2. Technologies Used

| Layer | Technology | Description |
|-------|-------------|-------------|
| Frontend | Next.js (React Framework) | Server-side rendered React app for SEO optimization |
| Styling | Tailwind CSS | Modern, responsive UI framework |
| Backend | Node.js + Express.js | RESTful API implementation with authentication and CRUD functionality |
| Database | MongoDB Atlas | Cloud-hosted NoSQL database |
| Mailer | SendPulse + Nodemailer | Email notifications for order confirmation and availability |
| Payments | Stripe (sandbox/test mode) | Card payment processing via PaymentIntents API + Stripe Elements |
| Hosting | Vercel (frontend), Render (backend) | Serverless, scalable deployment environments |
| CI/CD | GitHub Actions | Automated build, test, and deployment workflow |
| Containerization | Docker + docker-compose | Consistent local and production environments |

---

## 3. Project Overview

The project supports three main user roles:

### 3.1 Guest (Unauthenticated User)
- Can browse publicly available pages and products.
- Cannot place orders or access protected resources.

### 3.2 Registered User
- Can register, log in, and manage their profile.
- Can add products to the cart and place orders.
- Receives confirmation emails upon successful order submission.

### 3.3 Administrator
- Accesses a dedicated admin dashboard.
- Manages users, products, and orders.
- Confirms or rejects product availability and triggers user notifications.

---

## 4. Functional Requirements

### 4.1 Core Features
- User registration, login, and logout (JWT authentication)
- CRUD operations on products and orders
- Responsive product catalog and search functionality
- Shopping cart, checkout, and Stripe-based card payment (sandbox/test mode)
- Order history for logged-in users
- Admin control for managing inventory and user accounts
- Email notifications for:
  - Order confirmation
  - Payment confirmation / payment failure
  - Product availability updates

### 4.2 Optional Enhancements
- Product categorization and filtering
- Integration with external APIs for additional data (e.g., cosmetic brands or product images)

---

## 5. Non-Functional Requirements
- Secure authentication with encrypted passwords
- Validation of user inputs on both client and server
- Optimized performance with caching and lazy loading
- SEO-friendly pages via Next.js server-side rendering
- Consistent deployment using Docker containers

---

## 6. Database Design
The database is implemented using **MongoDB Atlas**.  
Primary collections:
- `users` – stores user credentials and roles
- `products` – contains product details and inventory
- `orders` – records user orders, including status and timestamps

---

## 7. Documentation Deliverables
| File | Description |
|------|-------------|
| PROJECT_PLAN.md | Project plan with step-by-step task breakdown |
| DOCKER_SETUP.md | Docker and local environment setup guide |
| GANTT.md | Timeline representation using Mermaid chart |
| README.md | Documentation index |

---

## 8. Contributor
Developer

---

## 9. Implementation Status

### ✅ Completed Features
- [x] User authentication (JWT) with registration, login, logout
- [x] Product CRUD API implemented and tested
- [x] Order CRUD API implemented (user flows and admin management)
- [x] Dockerized dev environment with Mongo init and seeding
- [x] Postman collection covering Auth, Products, Orders
- [x] Frontend authentication system (login/register pages with AuthContext)
- [x] Frontend core pages and components (products, contact, gallery, etc.)
- [x] Responsive UI with theme system and modern styling
- [x] **Admin dashboard and product management system**
- [x] **File upload system with image compression**
- [x] **Toast notification system for user feedback**
- [x] **Enhanced form validation and error handling**
- [x] **SKU generation and duplicate validation**
- [x] **Base64 image support in backend**
- [x] **Dual SMTP email system (Gmail + SendPulse) with automatic failover**
- [x] **Email templates for welcome, order confirmation, product availability**
- [x] **Email testing interface in admin panel**
- [x] **Admin dropdown navigation with theme-aware styling**
- [x] **Role-based cart hiding for admin users**
- [x] **Production deployment on Vercel (frontend) and Render (backend)**
- [x] **CORS configuration for production environment**
- [x] **MongoDB Atlas integration with network access configuration**
- [x] **Live demo URLs and demo login credentials**
- [x] **Complete deployment documentation with root directory settings**
- [x] **CI/CD pipeline with auto-deployment on push to main branch**
- [x] **Shopping cart functionality with CartContext and cart page**
- [x] **Checkout flow and payment processing** - Shipping/billing form, order creation, Stripe PaymentIntent + Elements card form
- [x] **Stripe integration (sandbox/test mode)** - `paymentController.js` / `routes/payment.js`, authenticated PaymentIntent creation, webhook-driven order status updates and confirmation/failure emails
- [x] **Order history for users** - `/orders` page (list, expandable details, pagination)
- [x] **Order detail page** - `/orders/[id]`, fixes previously-broken links from order status/notification emails
- [x] **User profile management** - `/profile` page (edit info, change password)
- [x] **Newsletter sending** - `/api/newsletter/send` (admin), `/admin/newsletter` page, and a working `/unsubscribe` page
- [x] **Advanced product filtering UI** - `/products` page now exposes search, category, brand, price range, and sort
- [x] **Admin dashboard** - `/admin` page with key stats (users, products, orders, revenue, orders-by-status, recent orders, low stock), backed by `GET /api/admin/stats`
- [x] **Admin user management** - `/admin/users` page (search, role filter, pagination) plus `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status`; guards prevent an admin from changing their own role/status or removing the last active admin
- [x] **Forgot/reset password (end-to-end)** - `/forgot-password` and `/reset-password` pages; fixes a broken login-page link and a backend endpoint that claimed success without sending an email
- [x] **Product review submission** - `POST /api/products/:id/reviews` plus a star-rating/comment form on the product page; reviews were previously read-only display with no way to submit one

### 🔄 Remaining Features
- [ ] Performance optimization and monitoring
