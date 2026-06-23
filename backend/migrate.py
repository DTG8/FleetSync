import sqlite3

def run_migration(db_path="fleet.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add columns to drivers if they don't exist
    try:
        cursor.execute("ALTER TABLE drivers ADD COLUMN photo_url VARCHAR")
        print("Added photo_url to drivers.")
    except sqlite3.OperationalError:
        print("photo_url already exists in drivers.")

    try:
        cursor.execute("ALTER TABLE drivers ADD COLUMN allocated_vehicle_id INTEGER REFERENCES vehicles(id)")
        print("Added allocated_vehicle_id to drivers.")
    except sqlite3.OperationalError:
        print("allocated_vehicle_id already exists in drivers.")

    # Create new tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
        driver_id INTEGER NOT NULL REFERENCES drivers(id),
        task_description VARCHAR,
        dispatched_at DATETIME NOT NULL,
        returned_at DATETIME
    )
    """)
    print("Created assignments table.")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_accessories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
        item_name VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'Present',
        last_updated DATETIME NOT NULL
    )
    """)
    print("Created vehicle_accessories table.")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_accessory_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
        accessory_id INTEGER NOT NULL REFERENCES vehicle_accessories(id),
        item_name VARCHAR NOT NULL,
        old_status VARCHAR,
        new_status VARCHAR NOT NULL,
        updated_at DATETIME NOT NULL
    )
    """)
    print("Created vehicle_accessory_history table.")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
