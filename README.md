# Dashboard Clients — Stage AI Labs

Panel de control, portal de clientes y flujo de onboarding conversacional para clientes de Stage AI Labs.

## Caracteristicas

- **Flujo de Onboarding Interactivo**: Seleccion de canal inicial (Instagram, Facebook, TikTok), definicion de objetivos y personalizacion.
- **Panel de Control para Clientes**: Vistas organizadas por secciones:
  - **Inicio**: Metricas, actividad reciente y accesos rapidos.
  - **Bandeja**: Vista de conversaciones y mensajes directos.
  - **Contactos**: Directorio de clientes y leads generados.
  - **Automatizaciones**: Configuracion de flujos y respuestas automaticas.
  - **Configuracion**: Preferencias de cuenta, tema (Claro / Oscuro / Sistema) y conexiones.
- **Autenticacion y Persistencia con Supabase**: Gestion de usuarios, perfiles y politicas RLS.
- **Interfaz Moderna**: Disenada con React, Vite, Tailwind CSS y Lucide Icons.

## Stack Tecnologico

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS, PostCSS, Autoprefixer
- **Backend y Base de Datos**: Supabase (Auth, Postgres, RLS)
- **Iconos**: Lucide React

## Configuracion Local

1. Clonar el repositorio:
```bash
git clone https://github.com/YovngScott/dashboard-clients.git
cd dashboard-clients
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Copiar `.env.example` a `.env` y configurar las credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Iniciar servidor de desarrollo:
```bash
npm run dev
```

5. Compilar para produccion:
```bash
npm run build
```
