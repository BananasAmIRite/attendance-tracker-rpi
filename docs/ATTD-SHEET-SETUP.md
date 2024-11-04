# Setting up the Attendance Sheet

Setting up the attendance sheet is simple.

1. Make a copy of the [RoboLancers Attendance Sheet](https://docs.google.com/spreadsheets/d/1BiZpa3BXBcyJhQoAAEWD2k8pP4-5hgI92cqg8C6ojTw/copy) and read the preliminarly instructions
2. Navigate to `/attendance-tracker-server/.env`
3. Set the Sheet ID of the newly cloned sheet for the `USER_SHEET_ID` and `ATTD_SHEET_ID` fields
4. Set `USER_SHEET_RANGE` as `Users!A2:E`. This is where you will add any additional members into the system.
5. Set `ATTD_SHEET_RANGE_IN` and `ATTD_SHEET_RANGE_OUT` to the `AttendanceLogIn` and `AttendanceLogOut` sheets respectively. This is where attendance will be logged to.
6. Restart the Raspberry PI and enjoy!
