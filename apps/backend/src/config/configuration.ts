export default () => ({
  port: parseInt(process.env.BACKEND_PORT || '4000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SIGNING_KEY,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
