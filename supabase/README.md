# Sueil cloud (Supabase)

Proyecto: `rmqdfrwcnvwntabatzkw` (auth storageKey `sueil-cloud` en la PWA).

## Función `ia-chat`

Proxy a Grok (xAI). La clave **nunca** va al cliente ni al repo.

```bash
# Una vez, con la CLI de Supabase autenticada:
supabase secrets set XAI_API_KEY="…" --project-ref rmqdfrwcnvwntabatzkw
supabase functions deploy ia-chat --project-ref rmqdfrwcnvwntabatzkw
```

La PWA llama `POST /functions/v1/ia-chat` con el JWT de la familia.
