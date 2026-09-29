# Revisión del 29 de septiembre de 2026

## Controles comprobados

- Supabase: ninguna tabla pública sin RLS en el proyecto Dashboard.
- Consultas anónimas y con identidad autenticada sin membresía no devolvieron agentes, documentos ni membresías.
- Inicio de sesión sin token CAPTCHA rechazado por Supabase con `captcha_failed`.
- Bucket agent-context privado, límite de 20 MiB y MIME PDF.
- Revocados permisos generales de escritura en las tablas de la plataforma de agentes. Verificado: no se pueden editar status, organization_id o plan_code desde authenticated; sí se pueden editar los campos autorizados del agente.
- Corregida la política de inserción de documentos para exigir que agente y documento pertenezcan a la misma organización.
- Registro de propiedad del PDF antes de subirlo, conforme a Storage RLS. Validación cliente de tamaño, tipo y firma PDF; esto no sustituye un análisis antimalware del servidor.
- Política CSP añadida sin permitir scripts inline, además de las cabeceras existentes.
- Auditoría Bun: cero vulnerabilidades conocidas en 252 paquetes en el momento de la revisión.
- Build, comprobación TypeScript, lint y 8 pruebas automáticas completados.
- Revisión visual de acceso móvil 375 × 667 y formularios del asistente en móvil y escritorio. No se probó en un iPhone físico.

## Límites y pendientes explícitos

- No equivale a un pentest completo ni garantiza ausencia de vulnerabilidades.
- No se ejecutó carga masiva, restauración real, pagos reales ni pruebas de canales externos.
- No hay Edge Functions desplegadas en Dashboard; no se certifican checkout, webhooks, ingestión segura de PDFs ni procesamiento autónomo.
- Los documentos permanecen con estado uploading hasta que el backend complete su validación. No se marca un archivo como seguro desde el navegador.
- Las funciones SECURITY DEFINER revisadas siguen generando avisos por ser invocables. Se conservaron sus comprobaciones de identidad y rol; no se cambiaron a ciegas.
- [Aviso sobre funciones privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- [Protección contra contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) desactivada; requiere revisar el plan contratado antes de habilitarla.
- Tablas privadas sin políticas continúan cerradas por RLS, deliberadamente; no se añadieron permisos para silenciar avisos.
- Validación posterior al despliegue: ejecutar `node scripts/security-smoke.mjs` y comprobar visualmente el dominio público.

## Publicación

La integración Git de Cloudflare Pages publica main. `npm run build` ahora exige tipos, lint y pruebas antes de generar el artefacto. Ver DEPLOYMENT.md.
