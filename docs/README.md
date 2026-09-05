# Documentation Index

This folder contains planning/specification documentation for the **SveVišnja Kozmetika** web application project (repo/technical name: `cosmetic-shop`).
The documentation covers the specification, implementation plan, Docker setup, and Gantt chart for the project.

For the main graded technical writeup (architecture, API routes, design patterns, functionality walkthrough), see `documentation.md` at the repo root instead - the files here are supporting planning artifacts.

## Files Overview

| File | Description |
|------|-------------|
| [SPECIFICATION.md](./SPECIFICATION.md) | Technical and functional specification of the project |
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | Detailed implementation plan with estimated hours |
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Docker and local development setup instructions |
| [GANTT.md](./GANTT.md) | Mermaid Gantt chart representing project timeline |

This folder also holds a Postman collection (`Cosmetic_Shop_API.postman_collection.json`) and a design reference image (`cosmetic-shop_design.png`).

## Related Information

- The project is implemented using the **MERN** stack with **Next.js** for the frontend and **Express.js** for the backend.
- Hosting: Frontend on **Vercel**, backend on **Render**, and database on **MongoDB Atlas**.
- CI/CD: Implemented using **GitHub Actions**.
- Email notifications are handled via a dual-SMTP setup (**Gmail** primary, **SendPulse** backup).
- Admin notifications (new orders, payment outcomes, errors) are sent via **Slack Incoming Webhooks**.
- The UI and transactional emails are bilingual (**Serbian** default / **English**), switched instantly via a `LanguageContext`/`useTranslation()` hook (mirrors the existing theme switcher), with the choice persisted to `localStorage` and, once signed in, to the user's account.
- Local development always runs through one of `docker-compose.dev.yml` / `docker-compose.override.yml` / `docker-compose.prod.yml` (there is no plain `docker-compose.yml`) - see `DOCKER_SETUP.md` or the root `SETUP.md`.

---
