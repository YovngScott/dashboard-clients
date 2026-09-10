/*
# Add theme preference to onboarding profiles

1. Modified Tables
- `onboarding_profiles`
- `theme_preference` stores `light`, `dark`, or `system` for the user's preferred appearance.

2. Security
- Existing owner-scoped RLS policies remain unchanged and continue to protect this column with the profile row.

3. Important Notes
- The new column defaults to `system` so existing users immediately follow their device setting.
- The change is additive and does not remove or rewrite existing profile data.
*/

ALTER TABLE public.onboarding_profiles
ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system';
