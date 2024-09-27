import { JWT } from 'google-auth-library';
import { sheets, sheets_v4 } from '@googleapis/sheets';
import { config } from 'dotenv';
config();

export let serviceAccountAuth: JWT;

export let SheetInstance: sheets_v4.Sheets;

export const initJWT = async () => {
    console.log('Initiating JWT and SheetInstance');
    serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    SheetInstance = sheets({ version: 'v4', auth: serviceAccountAuth });
};
