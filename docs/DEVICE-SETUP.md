# Setting up Attendance Device

### Materials

-   Raspberry PI 4 Model B (3GB+) & MicroSD Card (~64GB+)
-   Mifare RC522 Card Sensor Module
-   SunFounder 7 Inch Touchscreen Display
-   Jumper Wires

## Environment Setup

1. [Install Raspberry PI OS](https://www.raspberrypi.com/documentation/computers/getting-started.html) on the Raspberry PI. Ensure SSH is enabled and the version is 64-bit.
2. Connect the Raspberry PI to the touchscreen display
3. Follow the below to wire the RC522 chip to the Raspberry PI:

    - SDA connects to Pin 24
    - SCK connects to Pin 23
    - MOSI connects to Pin 19
    - MISO connects to Pin 21
    - GND connects to Pin 6
    - RST connects to Pin 22
    - 3.3v connects to Pin 1

4. Enable SPI in raspi config

    - Run `sudo raspi-config`, select Interface Options > SPI > Enable
    - Reboot the raspberry pi: `sudo reboot`
    - Check if SPI is enabled by running `lsmod | grep spi`. If `spi_bcm2835` is displayed, you're good.
