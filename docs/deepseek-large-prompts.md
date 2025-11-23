# DeepSeek Large Prompt Handling

## Overview
Large prompts can cause timeouts or exceed API limits. The application implements chunking and summarization to reliably process oversized inputs and a configurable timeout.

## Configuration
- `DEEPSEEK_MAX_PROMPT_CHARS` (default: 20000): threshold before chunking is applied.
- `DEEPSEEK_CHUNK_SIZE` (default: 12000): size in characters per chunk.
- `DEEPSEEK_TIMEOUT_MS` (default: 60000): request timeout.
- `DEEPSEEK_RATE_LIMIT_WINDOW_MS` (default: 60000): per-route limiter window.
- `DEEPSEEK_RATE_LIMIT_MAX` (default: 60): requests allowed per window.

## Behavior
- If the prompt length is under `DEEPSEEK_MAX_PROMPT_CHARS`, the app sends it directly.
- If over, the app splits the prompt into chunks and requests concise summaries per chunk, then generates a final answer based on combined summaries.
- Errors include `limit_info` to inform users about size constraints.

## Best Practices
- Prefer concise prompts; include only essential context.
- For very large documents, pre-summarize sections and supply highlights.
- Avoid repeated content; deduplicate before submitting.

## Limits and Messages
- When size limits are hit, the API responds with a clear error message and `limit_info.max_chars`.
- The frontend surfaces user-friendly guidance about chunking and maximum size.

## Verification
- Unit tests simulate large prompts and validate chunking without timeouts.
- Performance tests emulate longer-running operations to validate the increased timeout.
- You can test manually via the UI by pasting a long prompt; the backend performs chunked processing.

## Rollback
- Revert env values to previous defaults (e.g., `DEEPSEEK_CHUNK_SIZE=8000`, `DEEPSEEK_TIMEOUT_MS=45000`).
- Restart the backend services after changing env values.
