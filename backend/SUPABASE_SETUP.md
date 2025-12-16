# How to Connect Supabase

1.  **Get the Connection String**:
    *   Go to your Supabase Project Dashboard.
    *   Click **Connect** (top right) OR **Project Settings > Database**.
    *   Select **URIs** (not JDBC/Node).
    *   Copy the string. It looks like:
        `postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
    *   **Important**: Replace `[YOUR-PASSWORD]` with the password you created for the database.

2.  **Update Local Environment**:
    *   Open `g:\TUITION\backend\.env`.
    *   Replace `DATABASE_URL="..."` with your new Supabase URL.
    *   Add `?pgbouncer=true` to the end if using the Pooler URL (port 6543), or `?sslmode=require` if Direct to port 5432. Supabase usually gives port 6543 (Transaction Pooler) or 5432 (Session).
    *   *Tip*: Use the **Session** Mode (Port 5432) for Prisma migrations (`db push`), and **Transaction** Mode (Port 6543) for the App.
    *   For now, just use the Session one (Port 5432) to keep it simple.

3.  **Initialize the Database**:
    Run these commands in your terminal (`G:\TUITION\backend`):
    ```bash
    npx prisma db push
    node seed.js
    node scripts/reset_admin_creds.js
    ```

4.  **Confirm**:
    If no red errors appear, you are connected!

5.  **For Vercel**:
    *   Copy that same `DATABASE_URL` and add it to Vercel Environment Variables.
