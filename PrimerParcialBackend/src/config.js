import dotenv from 'dotenv';

dotenv.config();

export const TOKEN_SECRET = 'secret123Guitar.'

const frontendUrlsString = process.env.FRONTEND_URL || 'http://localhost:3000';
export const FRONTEND_URLS = frontendUrlsString.split(',').map(url => url.trim());
export const FRONTEND_URL = FRONTEND_URLS[0];
