import dotenv from 'dotenv';

dotenv.config();

export const config = {
  APP_NAME: 'Syllabus NLP Disaster Tweets API',
  VERSION: '1.0.0',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
};

