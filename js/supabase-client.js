/* ============================================================
   JARA ∆ — Supabase Client
   js/supabase-client.js

   Single shared Supabase instance used across all pages.
   Import this file in every HTML page that needs Supabase.

   HOW TO FIND YOUR CREDENTIALS:
   1. Go to https://supabase.com
   2. Open your project
   3. Click "Project Settings" (gear icon, left sidebar)
   4. Click "API"
   5. Copy "Project URL" → paste as SUPABASE_URL
   6. Copy "anon public" key → paste as SUPABASE_ANON_KEY
============================================================ */

/* ==========================
   CHANGE THIS
   Replace both values below with your real Supabase credentials.
   Never share your service_role key — only use the anon key here.
========================== */
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/* ============================================================
   Initialise and export the client.
   Every other JS file imports `window._supabase` from here.
============================================================ */
const { createClient } = supabase;
window._supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
