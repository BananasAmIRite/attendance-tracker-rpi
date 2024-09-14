# Setting up Kiosk Mode on Raspberry PI

This will ensure that the Raspberry PI cannot be tampered with outside of SSH and will always open the attendance tracker window.

## Install on-screen keyboard

1. Install the onboard keyboard

```
sudo apt install onboard -y
sudo apt install at-spi2-core
```

2. Navigate to raspberry pi > preferences > onboard settings & change the following. Then, restart the device.

    - Auto-show when editing text: true
    - Window > Dock to screen edge: true

## Setup kiosk

1. Open the wayfire configuration file: `nano $HOME/.config/wayfire.ini`
2. Paste the following into the `[autostart]` portion of the file (create a new one if there isn't already)
   2.1. Edit the path for `start-app` to be the path of the project's `start.sh` file

```ini
panel = wfrespawn wf-panel-pi
background = wfrespawn pcmanfm --desktop --profile LXDE-pi
xdg-autostart = lxsession-xdg-autostart
start-app = bash $HOME/attendance-tracker-rpi/start.sh
chromium = chromium-browser http://localhost:3000/ --enable-offline-auto-reload --kiosk --noerrdialogs --disable-infobars --no-first-run --ozone-platform=wayland --enable-features=OverlayScrollbar --start-maximized
screensaver = false
dpms = false
```

3. `sudo reboot`
