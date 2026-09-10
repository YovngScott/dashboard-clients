/*
# Create onboarding profiles

1. New Tables
- `onboarding_profiles` stores each signed-in creator's setup choices.
- `id` (uuid, primary key linked to auth.users)
- `display_name` (text, optional creator or brand name)
- `channel` (text, selected social channel)
- `account_type` (text, selected audience type)
- `goals` (text array, selected monetization goals)
- `discovery_source` (text, how the creator found the product)
- `onboarding_complete` (boolean, whether setup was finished)
- `created_at` and `updated_at` (timestamps)

2. Security
- Row Level Security is enabled.
- Authenticated users can only read, create, update, or delete their own profile row.

3. Important Notes
- The primary key is also the owner id so a user can have one profile.
- New rows default to the currently signed-in user through `auth.uid()`.
*/

CREATE TABLE IF NOT EXISTS public.onboarding_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  channel text,
  account_type text,
  goals text[] NOT NULL DEFAULT '{}',
  discovery_source text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can view own onboarding profile"
  ON public.onboarding_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can create own onboarding profile"
  ON public.onboarding_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can update own onboarding profile"
  ON public.onboarding_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own onboarding profile" ON public.onboarding_profiles;
CREATE POLICY "Users can delete own onboarding profile"
  ON public.onboarding_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
