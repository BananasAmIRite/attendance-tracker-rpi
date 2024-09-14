# Set up project

#### Clone this project onto the device you wish to use

## Service Account

#### The attendance system will use the service account to gain access to the Google Sheets

1. Create a Service Account in Google Cloud (Navigate to APIs & Services > Credentials > Create a new service account)
2. Enable Google Sheets in Google Cloud Console
3. Note the Service Account Email Address & share the Google Sheets with that service account
4. Download the service account credentials (Credentials > Edit service account you created > Keys > Add Key using JSON)
5. Open the downloaded JSON file and note the `client_email` and `private_key` fields

## Configure Server

1. Navigate to the [attendance-tracker-server](/attendance-tracker-server/) directory
2. rename the `.env.example` to `.env` & fill out all fields

| Key                            | Description                                                                                             | Default         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` in the JSON file                                                                         |                 |
| `GOOGLE_PRIVATE_KEY`           | `private_key` in the JSON file (do NOT leak this)                                                       |                 |
| `USER_SHEET_ID`                | sheet id of the user sheet containing all valid users for attendance                                    |                 |
| `USER_SHEET_RANGE`             | range of user sheet, containing data in order: id, first name, last name, nfc id                        |                 |
| `ATTD_SHEET_ID`                | sheet id of the attendance sheet containing all attendance logs                                         |                 |
| `ATTD_SHEET_RANGE`             | range of attendance sheet, containing data in order: id, date, time                                     |                 |
| `DATABASE_URL`                 | Database URL for caching in case of WiFi blackout (relative to /prisma)                                 | "file:./dev.db" |
| `PYTHON_PATH`                  | Path to the python installation's python executable; Fill this out in [Setup Manual](./SETUP-MANUAL.md) |                 |
| `ADMIN_PANEL_PW`               | the password to access attendance caches                                                                | admin           |

## Configure Client

1. Navigate to the [attendance-tracker-client](/attendance-tracker-client/) directory
2. Rename the `.env.example` to `.env` & fill out all fields
