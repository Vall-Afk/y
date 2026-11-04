# Beauté Engagement Features

These commands are registered by the engagement module. Optional providers are deliberately opt-in. Never commit `.env`, WhatsApp auth files, provider keys, or tokens.

## Commands

- `.roast saya` / `.puji saya`: self-directed, mild response. A user can grant 30-day consent with `.roast izin` or `.puji izin`; they can optionally share a short bio with `.roast bio <about>`. Another member can be tagged only after they opted in. `.roast cabut` removes consent and the temporary bio. The bot does not scrape profile photos or private chat history.
- `.tarot` / `.ramalan`: entertainment only; not factual predictions.
- `.zodiak DD/MM`: Western sun-sign lookup.
- `.cekhoax`: reply to a claim. Uses Google Custom Search when both CSE variables exist, otherwise DuckDuckGo Instant Answer. Results are leads, not a truth verdict; the bot labels claims unverified.
- `.simpulkan on` / `.simpulkan off`: group admins opt in/out. Up to 100 non-command text messages remain in RAM until off or restart. `.simpulkan` or `.drama` produces an AI summary through Gemini/Ollama, or an extractive local fallback.
- Send a WhatsApp voice note directly to the bot, or reply to one with `.tanyavoice`. It transcribes with an OpenAI-compatible STT endpoint or local whisper.cpp. The transcript is answered in text; optional TTS sends audio.
- `.stikermeme <prompt>`: uses an image-generation endpoint when configured and converts the image to WebP. Without an image provider it creates a typographic text sticker.
- Group admins use `.antitoxic on/off`. The default detector is a conservative local phrase filter; optional AI classification is enabled only by `TOXIC_AI_ENABLED=true`. It warns and records a warning; it never auto-kicks.
- `.report <description>`: prepares a report and sends a short confirmation code to the owner. The owner publishes with `.report confirm CODE`; this requires a GitHub token with Issues: write.
- In private chat, a recipient uses `.menfess izin` to opt in, then a sender can use `.menfess 628xxxxxxxxxx | message`. `.menfess cabut` opts out; reply to a received message with `.menfess lapor` to notify the owner. Delivery is rate-limited and only allowed to opted-in recipients.

## Optional provider configuration

Copy only the variable names into the local `.env`. Do not paste real values into GitHub.

### Gemini / local Ollama

- `GEMINI_API_KEY`, optional `GEMINI_MODEL` use Gemini.
- If Gemini is absent or unavailable, the bot tries Ollama at `OLLAMA_URL` (default `http://127.0.0.1:11434`) with `OLLAMA_MODEL` (default `qwen2.5:3b`).
- Install/pull a model in Ollama separately. A small model may still be slow on low-memory devices.

### Fact search

- `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` are optional.
- Without them, a limited DuckDuckGo Instant Answer lookup is attempted. It is not a full web search or a fact-check verdict.

### Voice transcription / speech

Remote OpenAI-compatible transcription:
- `WHISPER_API_URL` should point to an audio transcription endpoint.
- `WHISPER_API_KEY` is its bearer token; `WHISPER_MODEL` defaults to `whisper-1`.

Local Windows / Termux:
- Install whisper.cpp and a compatible model file.
- Set `WHISPER_CPP_PATH` and `WHISPER_MODEL_PATH`.
- Install FFmpeg or set `FFMPEG_PATH`. The optional `ffmpeg-static` package is used if available.
- Audio is capped at 15 MB and temporary files are deleted after transcription.

Optional TTS:
- Set `TTS_API_URL` and `TTS_API_KEY` to an OpenAI-compatible speech endpoint. Without it, the answer remains text.

### Image generation

- For AUTOMATIC1111 Stable Diffusion WebUI, enable its API and set `IMAGE_GEN_API_URL=http://127.0.0.1:7860/sdapi/v1/txt2img`.
- Or set `IMAGE_GEN_API_URL` to an OpenAI-compatible image generation endpoint and optionally set `IMAGE_GEN_API_KEY` / `IMAGE_GEN_MODEL`.
- If unset, `.stikermeme` uses the built-in typographic sticker renderer. It does not pretend to generate an AI image.

### Toxic-language AI

- Set `TOXIC_AI_ENABLED=true` only if Gemini or Ollama is available.
- If unavailable, a conservative local phrase filter remains active.
- No automatic kick. Admins retain control; warnings can be reviewed with existing moderation commands.

### GitHub bug reports

- Set `GITHUB_TOKEN` with fine-grained repository permission `Issues: write`.
- Set `GITHUB_REPOSITORY=Vall-Afk/y` or another repository you administer.
- Users submit `.report <description>`; the owner receives a confirmation code and explicitly publishes using `.report confirm CODE`.
- Phone numbers and email addresses are redacted from report text. Never use a broad personal access token if a fine-grained token is possible.

## Data and privacy

- Menfess recipient consent is stored in `DATA_DIR/menfess-consent.json` with restrictive file permissions.
- Anti-toxic group opt-ins are stored in `DATA_DIR/antitoxic-groups.json`.
- Group summary text is memory-only, bounded to 100 messages, and cleared by `.simpulkan off` or process restart.
- Menfess never delivers to a number without explicit opt-in. Recipients can opt out at any time.
- Roast/puji uses only the target's voluntary consent and optional self-provided bio; it does not inspect profile pictures.
- External AI providers receive only the prompt/text needed for the selected feature. Do not send highly sensitive content.
