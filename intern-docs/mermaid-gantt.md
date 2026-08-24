gantt
    title Cosmetic Shop Project Timeline (Calendar-based)
    dateFormat  YYYY-MM-DD
    axisFormat  %d-%b

    section Project Setup
    Project Initialization           :done,    des1, 2025-10-21, 1d
    Folder & Env Setup               :done,    des2, 2025-10-22, 1d

    section Database Design
    MongoDB Schema & Atlas Setup     :active,  des3, 2025-10-23, 1d
    Seed Test Data                   :         des4, 2025-10-24, 0.5d

    section Authentication
    User Registration/Login          :         des5, 2025-10-24, 1.5d
    Role-based Access Control        :         des6, 2025-10-27, 1d
    Validation & Security            :         des7, 2025-10-28, 1d

    section Backend CRUD
    Products CRUD API                :         des8, 2025-10-29, 2d
    Orders CRUD API                  :         des9, 2025-10-31, 2d
    Admin Management API             :         des10, 2025-11-02, 2d

    section Email Integration
    SendPulse Setup & Config         :         des11, 2025-11-04, 1d
    Order & Product Availability Emails :      des12, 2025-11-05, 1d
    Testing Email Functionality      :         des13, 2025-11-06, 0.5d

    section Frontend Development
    Public Pages                     :         des14, 2025-11-06, 3d
    User Pages                       :         des15, 2025-11-11, 4d
    Admin Panel                      :         des16, 2025-11-15, 3d

    section Styling & UI/UX
    Tailwind Design & Components     :         des17, 2025-11-18, 3d
    Responsive Optimization          :         des18, 2025-11-21, 3d

    section Docker & CI/CD
    Dockerfile & Compose             :         des19, 2025-11-24, 1d
    Local Docker Test                :         des20, 2025-11-25, 1d
    CI/CD GitHub Actions Setup       :         des21, 2025-11-26, 2d

    section Testing & Verification
    API Testing (Postman)            :         des22, 2025-11-28, 2d
    Full Workflow Test               :         des23, 2025-12-01, 2d

    section Deployment & Final Touches
    Frontend Vercel Deploy           :         des24, 2025-12-03, 0.5d
    Backend Render Deploy            :         des25, 2025-12-03, 0.5d
    Documentation & README           :         des26, 2025-12-04, 2d

