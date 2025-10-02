import dotenv from 'dotenv';

dotenv.config();

export const TOKEN_SECRET = 'secret123Guitar.'

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';
