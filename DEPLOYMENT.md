# Publicación de la app

Cloudflare Pages `stage-clients-app` publica la rama `main` de
`YovngScott/dashboard-clients` en `https://app.stagelaboratories.com`.

El usuario autorizó el 29 de septiembre de 2026 publicar automáticamente los
cambios solicitados de esta app después de verificarlos. No es necesario pedir
de nuevo autorización por cada publicación ordinaria de este proyecto.

1. Revisar el diff y ejecutar `npm run build`. Incluye tipos, lint y pruebas.
2. Revisar las superficies cambiadas en móvil y escritorio.
3. Confirmar que las claves de prueba de Turnstile solo se usaron en desarrollo.
4. Crear el commit y hacer push de `main` para activar la integración de Pages.
5. Confirmar el despliegue correspondiente al commit y comprobar la web pública.

La clave `VITE_TURNSTILE_SITE_KEY` es pública y se configura en Pages. La clave
secreta permanece en Supabase. Nunca incluir secretos en variables `VITE_*`.
Las claves de prueba usadas en el proceso local no deben sustituir la variable
de producción en Cloudflare.

La publicación no equivale a una certificación de seguridad. Documentar los
controles comprobados y cualquier limitación observada en cada revisión.
