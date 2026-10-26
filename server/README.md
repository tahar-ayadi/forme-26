# API server

The API only accepts requests from `FRONTEND_ORIGIN`, defaulting to
`http://localhost:5173` for local development. JSON request bodies are limited
to 100 KB and responses include baseline security headers.

Per-IP rate limiting is not currently enabled because the project has no
rate-limiting dependency; this remains a production hardening item before
exposing the API broadly.
