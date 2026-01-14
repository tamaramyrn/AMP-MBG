Act as a Senior DevOps and Software Engineer. I am developing a reporting web application (image uploads & data) and need a step-by-step guide to set up a Monorepo and monolith architecture using **Bun Workspaces**.

**Tech Stack:**
1. **Frontend:** React TS, Vite, Tailwind, Shadcn UI, Tanstack Router, Tanstack Query.
2. **Backend:** Hono (TypeScript).
3. **Runtime & Package Manager:** Bun.

**Infrastructure & Deployment Requirements:**
Please design the folder structure and configuration based on the following strategy:
1. **Monorepo Structure (Bun Workspaces):**
   - Root folder handles dependency management (shared node_modules).
   - Unified scripts in the root to run dev servers (FE & BE) in parallel or build both.
2. **Deployment Strategy:**
   - **Domain:** Cloudflare.
   - **VPS:** DigitalOcean ($6/mo droplet).
   - **Server Management:** Dokploy.
3. **CI/CD Pipelines:**
   - **Frontend:** Auto-deploy to Cloudflare Pages (via GitHub Apps integration).
   - **Backend:** Docker build pipeline -> Push to Container Registry -> Server (Dokploy) pulls image via Webhook trigger.

**Expected Output:**
- Project directory tree structure.
- `package.json` configuration for the root (workspaces setup) and individual services.
- Dockerfile example for the Backend (Hono).
- A brief guide on the CI/CD flow described above.

**Constraint:**
- Make it comprehensive, coheren, concret, concise, clear, straight to the point, not redundant, not yapping, not hallucination, not overlappig
- Do not use any emoji, emoticon, sticker or something like that
- Maximum 5 words of comment per section or class or function or something like that
- Please write in the effective, efficient, clean, and readable code, not overengineering, based on the use case
- Please make sure 2 until 3 times until its all really really correct and clean