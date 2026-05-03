# AI Integration Setup (EcoLake)

This project now includes:
- Supabase Edge Function: `eco-assistant-chat`
- Supabase Edge Function: `quick-report-vision`
- Client hook: `hooks/use-ai.ts`
- Report screen AI Assist button in `app/(tabs)/report.tsx`
- Quick Report tab in `app/(tabs)/quick-report.tsx`

## 1) Configure Supabase Secrets

Use Supabase secrets so the API key never ships in the mobile app bundle.

```bash
supabase secrets set \
  AI_API_KEY="<your-nvidia-api-key>" \
  AI_API_URL="https://integrate.api.nvidia.com/v1/chat/completions" \
  AI_MODEL="qwen/qwen3.5-122b-a10b"
```

## 2) Deploy the Edge Functions

```bash
supabase functions deploy eco-assistant-chat
supabase functions deploy quick-report-vision
```

## 3) Local Development (Optional)

You can run the function locally with your `.env` file:

```bash
supabase functions serve eco-assistant-chat --env-file .env
supabase functions serve quick-report-vision --env-file .env
```

## 4) In-App Usage

Users can open the report form and tap **AI Assist** in the description section.
The app sends a request to `eco-assistant-chat`, which calls NVIDIA's OpenAI-compatible API and returns polished report text.

Users can also open the **Quick Report** tab to upload a photo and get AI waste type and severity in seconds.
The app sends the first photo URL to `quick-report-vision` for analysis.

## Security Notes

- Do not call NVIDIA API directly from React Native client code.
- Keep `AI_API_KEY` only in Supabase project secrets.
- If the key was exposed, rotate it in NVIDIA dashboard and update Supabase secrets.
