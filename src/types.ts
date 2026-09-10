import { ReactNode } from 'react';

export type Screen = 'landing' | 'auth' | 'channel' | 'questions' | 'dashboard';
export type AuthMode = 'signin' | 'signup';
export type DashboardTab = 'Inicio' | 'Bandeja' | 'Contactos' | 'Automatizaciones' | 'Configuración';
export type ThemePref = 'light' | 'dark' | 'system';

export type Profile = {
  id: string;
  display_name: string | null;
  channel: string | null;
  account_type: string | null;
  goals: string[];
  discovery_source: string | null;
  onboarding_complete: boolean;
  theme_preference: ThemePref;
};

export type Option = {
  label: string;
  value: string;
  icon: ReactNode;
};
