# Vercel Deployment Guide

## 1. Project Configuration
*   **Project Name**: `jathin-s-learning-hub`
*   **Framework Preset**: **Other** (Select "Other" to use our custom configuration)
*   **Root Directory**: `./` (Leave default)

## 2. Environment Variables
You need to add these **3 variables** one by one.

### Variable 1 (Database)
*   **Key**: `DATABASE_URL`
### Variable 1 (Database)
*   **Key**: `DATABASE_URL`
*   **Value**: `postgresql://postgres.xizctbzoqmnmfkhfehbg:Iamrajx1984bc$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    *   **Note**: We added `.xizctbzoqmnmfkhfehbg` to the username so Supabase knows which project to connect to.

### Variable 2 (Security)
*   **Key**: `JWT_SECRET`
*   **Value**: `iamrajx-secret-key-2025`

### Variable 3 (API Connection)
*   **Key**: `NEXT_PUBLIC_API_URL`
*   **Value**: `/api`

## 3. Finish
*   Click **Deploy**.
