# Running Manually

Follow the guide for [pre-setup](./PRE-SETUP.md)

## Preliminary Installation

1. Install Node.js

```
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

2. Navigate to `attendance-tracker-rpi/attendance-tracker-server`
3. [Install dependencies](https://pimylifeup.com/raspberry-pi-rfid-rc522/) for RC522 library in a virtual environment. Note the path to the environment for later use

    - `python -m venv path/to/env` to create a virtual environment to install packages
    - `source path/to/env/bin/activate`
    - `pip install spidev`
    - `pip install mfrc522`
    - Add the environment variable `PYTHON_PATH` to `attendance-tracker-server` as `path/to/env/bin/python`

4. Install node dependencies for client and server by running `npm install` inside `attendance-tracker-rpi/attendance-tracker-server`, `attendance-tracker-rpi/attendance-tracker-client`, and `attendance-tracker-rpi/`
5. Navigate to `attendance-tracker-server` and run `npx prisma db push` to initialize the database
6. Navigate to `attendance-tracker-server` and `attendance-tracker-client` and run `npm run build` (NOTE: if you don't have enough memory to build client, skip this step)
7. Navigate to the root folder and run `npm install`
8. Run `npm run start` in the root folder
9. Open a browser and go to `http://localhost:3000`
