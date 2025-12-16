# Vercel Deployment Guide

## 1. Project Configuration
*   **Project Name**: `jathin-s-learning-hub`
*   **Framework Preset**: **Other** (Select "Other" to use our custom configuration)
*   **Root Directory**: `./` (Leave default)

## 2. Environment Variables
You need to add these **3 variables** one by one.

### Variable 1 (Database)
*   **Key**: `DATABASE_URL`
*   **Value**: `postgresql://postgres:Iamrajx1984bc$@db.xizctbzoqmnmfkhfehbg.supabase.co:5432/postgres`

### Variable 2 (Security)
*   **Key**: `JWT_SECRET`
*   **Value**: `iamrajx-secret-key-2025`

### Variable 3 (API Connection)
*   **Key**: `NEXT_PUBLIC_API_URL`
*   **Value**: `/api`

## 3. Finish
*   Click **Deploy**.
