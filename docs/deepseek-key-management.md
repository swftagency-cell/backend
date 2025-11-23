# DeepSeek API Key Management

## Overview
DeepSeek API access requires a secret key. This application reads the key from environment variables and never hardcodes the value in source code. Optional encrypted-at-rest support is provided.

## Store the Key
- Local development: set `DEEPSEEK_API_KEY` in your shell or `.env` (do not commit `.env`).
- CI/CD: add `DEEPSEEK_API_KEY` in your provider’s secrets panel (e.g., Vercel → Project Settings → Environment Variables).

## Optional Encryption
If you prefer storing an encrypted key, provide:
- `DEEPSEEK_API_KEY_ENC`: base64-encoded JSON payload `{ iv, data, tag }`
- `DEEPSEEK_KEY_PASSPHRASE`: passphrase used to derive the encryption key

Encryption/decryption uses AES-256-GCM. Generate an encrypted payload:
1. Create a random IV: `openssl rand -base64 12`
2. Encrypt: use a small script or KMS to produce `{ iv, data, tag }` JSON
3. Base64-encode the JSON and set to `DEEPSEEK_API_KEY_ENC`

## Rotation Procedure
1. Create the new key in DeepSeek portal.
2. Update CI/CD secrets with the new value (`DEEPSEEK_API_KEY` or `DEEPSEEK_API_KEY_ENC`/`DEEPSEEK_KEY_PASSPHRASE`).
3. Trigger a deployment; verify with `GET /api/deepseek/status` and a test request.
4. Remove the old key from secrets.

## Required Permissions
- Access to DeepSeek chat completions endpoint.
- Ensure the key is scoped only to required services; avoid unnecessary broad permissions.

## Usage Limits and Quotas
- Respect rate limits. The application enforces per-route rate limiting for DeepSeek.
- Monitor usage in the DeepSeek dashboard and configure alerts as needed.

## Secure Usage in Code
- No hardcoding; keys are read from env via `backend/utils/secrets.js`.
- Optional encrypted-at-rest decryption using `DEEPSEEK_API_KEY_ENC`.
- Request timeouts and error handling are implemented.
- Route-level rate limiting is configured for `/api/deepseek`.

## Verification
- With the backend running and the key set, execute: `npm run test:deepseek-connectivity` in `backend/`.
- Success prints `DeepSeek connectivity verified` and a 200 response.

