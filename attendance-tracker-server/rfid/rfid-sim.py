from tkinter import *
from tkinter import ttk

root = Tk()

entry_var = StringVar()

def submit():
    entry = entry_var.get()
    print(entry, flush=True, end="")
    entry_var.set("")


frm = ttk.Frame(root, padding=10)
frm.grid()
ttk.Entry(frm, textvariable=entry_var).grid(column=0, row=0)
ttk.Button(frm, text="Submit", command=submit).grid(column=1, row=0)
root.mainloop()