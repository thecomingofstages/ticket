// Generated by Wrangler on Fri Jul 26 2024 07:41:34 GMT+0700 (เวลาอินโดจีน)
// by running `wrangler types`

interface Env {
  ENVIRONMENT: string;
  SESSION_SECRET: string;
  HMAC_SECRET: string;
  LINE_SECRET: string;
  LINE_OAUTH_CLIENT_ID: string;
  LINE_OAUTH_CLIENT_SECRET: string;
  CORS_ALLOW_ORIGIN: string;
  TICKET: DurableObjectNamespace;
  DB: D1Database;
}
