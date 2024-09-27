import RPi.GPIO as GPIO
import mfrc522

reader = mfrc522.SimpleMFRC522()

reader_online = True

while (True):
    version = reader.READER.Read_MFRC522(0x37)
    if version == 0 and reader_online: # disconnected
        reader_online = False
        print("STAT:OFFLINE", flush=True, end="")
    elif version != 0 and (not reader_online): # reconnected
        reader_online = True
        print("STAT:ONLINE", flush=True, end="")
        # when we reconnect, reset the connection
        reader.READER.Close_MFRC522()
        reader = mfrc522.SimpleMFRC522()
    # read id and print if it exists
    id = reader.read_id_no_block()
    if id:
        print(f"ID:{id}", flush=True, end="")