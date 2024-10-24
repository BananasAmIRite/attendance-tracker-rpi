# Setting up Kiosk Mode on Raspberry PI

This will ensure that the Raspberry PI cannot be tampered with outside of SSH and will always open the attendance tracker window.

## Install on-screen keyboard

1. Install the onboard keyboard

```
sudo apt install onboard -y
sudo apt install at-spi2-core
```

2. Switch to the `X11` backend by running `sudo raspi-config` > Advanced Options > Wayland > X11 > Ok > Reboot

3. Navigate to raspberry pi > preferences > onboard settings & change the following. Then, restart the device.

-   General > Auto-show when editing text: true
-   General > Show when unlocking the screen: true
-   Window > Dock to screen edge: false (this doesn't work with chrome kiosk mode)
-   Window > Force window on top: true
-   (Optional) Layout > Phone
-   (Optional) Theme > Nightshade (The default one is ugly)
-   Auto-show > Auto-show when editing text: true
-   Auto-show > Keyboard movement strategy: Always follow window

## Setup kiosk

1. Copy the autostart file into user config

```shell
mkdir -p $HOME/.config/lxsession/LXDE-pi
cp /etc/xdg/lxsession/LXDE-pi/autostart $HOME/.config/lxsession/LXDE-pi/
```

2. Open the autostart config file `nano $HOME/.config/lxsession/LXDE-pi/autostart`
3. Paste the following at the end of the file and save
   (NOTE: if your school wifi has any login page, find how passwords are submitted, write & test an HTTP request to be run below)

```shell
onboard &
chromium-browser http://localhost:3000/ --enable-offline-auto-reload --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized --hide-crash-restore-bubble
```

4. Then, create a new service for the application `sudo nano /etc/systemd/system/attendance.service`
   Use the following:

```ini
[Unit]
Description=attendance service
Before=multi-user.target
After=basic.target

[Service]
User=pi # replace with rpi user
Type=exec
ExecStart=bash /path/to/start.sh # replace with absolute path

Restart=on-failure

# give the process a bit more priority on startup
CPUSchedulingPolicy=rr
CPUSchedulingPriority=15

[Install]
WantedBy=basic.target
```

and replace `/path/to/start.sh` with the absolute path to the git repository's `start.sh` file

5. Give permissions to access the service and enable it

```shell
sudo chmod 644 /etc/systemd/system/attendance.service
sudo systemctl daemon-reload
sudo systemctl enable attendance.service
```

6. `sudo reboot`

NOTE: to get the logs of the attendance service for the current boot, use `sudo journalctl -u attendance.service --boot=0`
