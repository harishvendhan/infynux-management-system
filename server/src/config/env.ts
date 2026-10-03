import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_for_infynux_dev_only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
};
