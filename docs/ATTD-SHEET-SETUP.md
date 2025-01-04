# Setting up the Attendance Sheet

1. Make a copy of the [RoboLancers Attendance Sheet](https://docs.google.com/spreadsheets/d/1BiZpa3BXBcyJhQoAAEWD2k8pP4-5hgI92cqg8C6ojTw/copy) and read the preliminarly instructions
2. Navigate to `/attendance-tracker-server/.env`
3. Set the Sheet ID of the newly cloned sheet for the `USER_SHEET_ID` and `ATTD_SHEET_ID` fields
4. Set `USER_SHEET_RANGE` as `Users!A2:E`. This is where you will add any additional members into the system.
5. Set `ATTD_SHEET_RANGE_IN` and `ATTD_SHEET_RANGE_OUT` to the `AttendanceLogIn` and `AttendanceLogOut` sheets respectively. This is where attendance will be logged to.
6. Restart the Raspberry PI and enjoy!

# Maintaining the Attendance Sheet
## Adding Users
1. Go to the Users Sheet
2. Add the name & id of the user as rows into the Users sheet (this CAN be imported from outside the sheet)
3. Drag the formula for the rest of the columns down

## Adding Dates
1. Go to "Meeting Dict (Formula)"
2. Add the required dates (note: these will be listed in order so list the dates in order)

## Logging Attendance Manually
1. Go to "Manual Attendance Sheet"
2. Mark attendance for the person for the specific date as needed

## Removing Users
 - Remove the user in the "Users" Sheet (DO NOT REMOVE the row, just the user listing) 

## Debugging Sheets Issues: 
### Attendance for some days don't show up
1. For each of "AttendanceLogTotal", "Attendance", "Stat Builder": 
2. Drag out the formulas either down or across to fill in all necessary columns/rows
