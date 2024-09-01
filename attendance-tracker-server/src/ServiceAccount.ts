import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { config } from 'dotenv';
config();

export const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
serviceAccountAuth.authorize().then((a) => {
    console.log('authorized? Access Token: ', a.access_token);
});

export const SheetInstance = google.sheets({ version: 'v4', auth: serviceAccountAuth });
