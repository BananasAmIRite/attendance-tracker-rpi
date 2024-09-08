import mfrc522

reader = mfrc522.SimpleMFRC522

while (True):
    print(reader.read_id(), flush=True, end="")