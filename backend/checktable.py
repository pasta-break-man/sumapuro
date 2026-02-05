# check_tables.py
import sqlite3

conn = sqlite3.connect("sumapuro.db")
rows = conn.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
).fetchall()
print(rows)
conn.close()
