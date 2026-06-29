# Velocity

A fast, and modern project management platform designed for collaborative teams to organize workspaces, assign tasks, schedule items visually on a drag-and-drop calendar, and streamline daily productivity.

---

## ⭐ Main Features

*   **Workspaces & Teams**: Create different workspaces for your teams (using Clerk). Invite members as either **Admins** or **Members**.
*   **Role Protections**: 
    *   Only **Admins** can create new projects, delete projects, or invite new team members to the workspace.
    *   Only **Project Leads** or **Admins** can add tasks, remove members, or change project settings.
*   **Drag & Drop Calendar**: Drag a task card onto a calendar date to quickly reschedule its deadline!
*   **Smart Search**: Type a project or task name in the search box. Click on a search result, and the website will automatically scroll down to that task and highlight it with a blue glow for 5 seconds.
*   **Change Assignees Easily**: Select who is working on a task using a simple dropdown list right on the screen.
*   **Project Settings & Danger Zone**: Update project name, progress, dates, and status. Workspace Admins can permanently delete a project and all its tasks using the red "Danger Zone" button.
*   **Morning Email Reminders**: The server automatically checks for late, unfinished tasks every morning at 8:00 AM and emails a friendly reminder to the assignee.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Redux (for state management), and Tailwind CSS (for styling).
*   **Backend**: Node.js & Express (for the API server).
*   **Database**: PostgreSQL (hosted on Neon).
*   **Other Tools**: Inngest (for daily email schedules) and Clerk (for user login and workspaces).

---

## 💻 How to Run it on Your Computer

### Step 1: Clone the Project
```bash
git clone https://github.com/Somnath-panda/Project-Management.git
cd Project-Management
```

### Step 2: Setup Environment Keys
Create a file named `.env` in the `server` folder and add your keys:
```env
DATABASE_URL="your_neon_postgres_database_link"
CLERK_PUBLISHABLE_KEY="your_clerk_public_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your_brevo_email"
SMTP_PASS="your_brevo_password"
SENDER_EMAIL="your_sender_email"
FRONTEND_URL="http://localhost:5173"
```

Create a file named `.env` in the `client` folder:
```env
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_public_key"
VITE_BASEURL="http://localhost:5000"
```

### Step 3: Install & Start
Open a terminal in the **`server`** folder:
```bash
npm install
npx prisma generate
npx prisma db push
npm run server
```

Open a second terminal in the **`client`** folder:
```bash
npm install
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## ☁️ How to Host it Online (Vercel)

### 1. Deploy the Backend Server
*   Connect the `server` folder to a new project in Vercel.
*   Add all the environment variables from your server `.env` file in the Vercel project settings.
*   Click **Deploy**.

### 2. Deploy the Frontend App
*   Connect the `client` folder to a new project in Vercel.
*   Set the **Framework Preset** to `Vite`.
*   Set the **Root Directory** to `client`.
*   Add these two environment variables:
    *   `VITE_BASEURL` = *(Your deployed Vercel backend URL)*
    *   `VITE_CLERK_PUBLISHABLE_KEY` = *(Your Clerk public key)*
*   Click **Deploy**.

### 3. Setup Clerk Webhooks
In your Clerk dashboard, go to the **Webhooks** tab and add a new endpoint pointing to your deployed backend URL:  
`https://your-backend-vercel-url.vercel.app/api/clerk-webhook`

Make sure to select and subscribe to these **7 events** so everything syncs to your database correctly:
*   `user.created`
*   `user.updated`
*   `user.deleted`
*   `organization.created`
*   `organization.updated`
*   `organization.deleted`
*   `organizationInvitation.accepted`
