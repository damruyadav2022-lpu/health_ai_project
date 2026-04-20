import sqlite3
import os

db_path = r'c:\Users\damru\health_ai_project\health_ai_project\backend\healthai.db'

print(f"Checking Database: {db_path}")

if not os.path.exists(db_path):
    print("❌ ERROR: Database file not found!")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check History
        cursor.execute("SELECT count(*) FROM prediction_history")
        h_count = cursor.fetchone()[0]
        
        # Check Patients
        cursor.execute("SELECT count(*) FROM patients")
        p_count = cursor.fetchone()[0]
        
        print(f"✅ DATABASE VERIFIED")
        print(f"History Records: {h_count}")
        print(f"Patient Records: {p_count}")
        
        if h_count > 0:
            cursor.execute("SELECT top_disease, risk_level FROM prediction_history LIMIT 5")
            rows = cursor.fetchall()
            print("Latest History Samples:")
            for r in rows:
                print(f" - {r[0]} ({r[1]})")
        
        conn.close()
    except Exception as e:
        print(f"❌ DATABASE ERROR: {str(e)}")
