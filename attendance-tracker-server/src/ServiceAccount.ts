import { JWT } from 'google-auth-library';
import { sheets } from '@googleapis/sheets';
import { config } from 'dotenv';
config();

export const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const SheetInstance = sheets({ version: 'v4', auth: serviceAccountAuth });
