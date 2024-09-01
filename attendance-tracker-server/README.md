# Google Setup

1. Create a Service Account in Google Cloud
2. Enable Google Sheets in Google Cloud Console
3. Note the Service Account Email Address & share the Google Sheets with that service account
4. Create `.env` file in this directory with the following information

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=           # Service Account Email
GOOGLE_PRIVATE_KEY=                     # Service Account Private Key (DO NOT COMMIT THIS)
USER_SHEET_ID=                          # Sheet ID of the Google Sheets with all the users available for attendance
USER_SHEET_RANGE=                       # Range of the users; User Sheet has the properties: Student ID, First Name, Last Name, NFC Id
ATTD_SHEET_ID=                          # ID of the Google Sheets housing the attendance data
ATTD_SHEET_RANGE=                       # Range of the attendance data; Properties: Student ID, Date, Time
DATABASE_URL="file:./dev.db"            # Database URL for caching in case of WiFi blackout
```

# Project Setup

1. Install rc522 library `pip install mfrc522-python`
2. Install node libraries `npm install`
3. Build the project `npm run build` or run `npm run dev` for development
4. Run the server `npm start`
