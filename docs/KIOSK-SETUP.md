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
