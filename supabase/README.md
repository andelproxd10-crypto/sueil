# Sueil cloud (Supabase)

Proyecto: `rmqdfrwcnvwntabatzkw` (auth storageKey `sueil-cloud` en la PWA).

## Función `ia-chat`

Proxy a Grok (xAI). La clave **nunca** va al cliente ni al repo.

Auth (en la función, `verify_jwt = false`):
- JWT de correo de la familia, o
- apikey / publishable del proyecto (tras código de familia en la PWA; sirve InPrivate sin sesión).

```bash
supabase secrets set XAI_API_KEY="…" --project-ref rmqdfrwcnvwntabatzkw
supabase functions deploy ia-chat --project-ref rmqdfrwcnvwntabatzkw
```

Tras cambiar `index.ts` o `config.toml`, hay que **volver a desplegar** la función.
