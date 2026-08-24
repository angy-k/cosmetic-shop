# Project Timeline – Gantt Chart

```mermaid
gantt
    title Cosmetic Shop Project Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %d-%b

    section Project Setup
    Project Initialization           :done,    des1, 2025-10-21, 1d
    Folder & Env Setup               :done,    des2, 2025-10-22, 1d

    section Database Design
    MongoDB Schema & Atlas Setup     :done,    des3, 2025-10-23, 1d
    Mongoose Models Implementation   :done,    des3b, 2025-10-24, 1d
    Seed Test Data                   :done,    des4, 2025-10-25, 0.5d

    section Authentication
    User Registration/Login          :done,    des5, 2025-10-25, 1.5d
    Role-based Access Control        :done,    des6, 2025-10-26, 1d
    Validation & Security            :done,    des7, 2025-10-27, 1d

    section Backend CRUD
    Products CRUD API                :done,    des8, 2025-10-29, 2d
    Orders CRUD API                  :done,    des9, 2025-10-31, 2d
    Admin Management API             :done,    des10, 2025-11-02, 2d

    section Email Integration
    Dual SMTP Setup (Gmail/SendPulse) :done,  des11, 2025-10-27, 1d
    Email Templates & Testing Interface :done, des12, 2025-10-27, 1d
    SMTP Error Handling & Timeout Fixes :done, des13, 2025-10-28, 0.5d

    section Frontend Development
    Core Components & Pages          :done,    des14, 2025-10-20, 3d
    Authentication System            :done,    des14b, 2025-10-25, 1d
    Admin Panel                      :done,    des16, 2025-10-26, 3d
    Admin Dropdown & Navigation      :done,    des16b, 2025-10-27, 1d
    Role-based Cart Hiding          :done,    des16c, 2025-10-27, 0.5d
    Shopping Cart & Checkout Flow    :done,    des15, 2025-12-10, 3d
    Stripe Payment Integration       :done,    des15b, 2025-12-13, 2d
    Order History Page               :done,    des15c, 2025-12-15, 1d
    Order Detail Page                :done,    des15d, 2026-08-23, 0.5d
    User Profile Page                :done,    des15e, 2026-08-23, 0.5d
    Admin User Management            :done,    des15f, 2026-08-23, 0.5d
    Forgot/Reset Password            :done,    des15g, 2026-08-23, 0.5d
    Product Review Submission        :done,    des15h, 2026-08-23, 0.5d

    section Styling & UI/UX
    Tailwind Design & Components     :done,    des17, 2025-10-22, 3d
    Theme System & Responsive Design :done,    des18, 2025-10-24, 2d
    Theme-aware Dropdown Styling     :done,    des18b, 2025-10-27, 0.5d

    section Docker & CI/CD
    Dockerfile & Compose             :done,    des19, 2025-10-24, 1d
    Local Docker Test                :done,    des20, 2025-10-25, 1d
    CI/CD Auto-deployment Setup     :done,    des21, 2025-10-28, 1d

    section Testing & Verification
    API Testing (Postman)            :done,    des22, 2025-10-26, 2d
    Production Testing               :done,    des23, 2025-10-28, 1d

    section Deployment & Final Touches
    Frontend Vercel Deploy           :done,    des24, 2025-10-28, 0.5d
    Backend Render Deploy            :done,    des25, 2025-10-28, 0.5d
    CORS Configuration & DB Setup    :done,    des25b, 2025-10-28, 1d
    Live Demo URLs & Credentials     :done,    des26, 2025-10-28, 0.5d
    Documentation & README           :done,    des27, 2025-10-28, 1d
```
---

## Notes
- Project started **October 21, 2025**; core features completed by **October 28, 2025**.
- Shopping cart, checkout flow, and Stripe payment integration (sandbox mode) added **December 10–15, 2025**, following the mentor's request to include payment processing in the project scope.
- Order detail page and user profile management added **August 23, 2026**, closing out the two frontend gaps identified during a review of the project's task-tracking docs.
- Admin dashboard, admin user management, advanced product filtering UI, and newsletter sending also added **August 23, 2026**.
- Forgot/reset password (end-to-end) and product review submission added **August 23, 2026**, after a full audit against the plan, TODO, mentor's proposal, and actual code turned up a broken login-page link (unsent reset email) and a read-only reviews section with no submission path.
- Total development time: approximately 130 hours completed out of 130 estimated.
- Most tasks completed ahead of schedule with successful production deployment.
- **Live Demo**: Frontend on Vercel, Backend on Render with MongoDB Atlas.
- **Remaining**: performance optimization and monitoring (optional future improvement, out of thesis scope).

---
