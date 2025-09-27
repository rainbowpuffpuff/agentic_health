import pandas as pd
import sys

# --- Configuration ---
# The name of your raw CGM log file
INPUT_FILENAME = 'cgm_log.csv'
# The name of the clean file we will create
OUTPUT_FILENAME = 'cgm_cleaned.csv'

print(f"--- Starting CGM Data Cleaning ---")
print(f"Input file: {INPUT_FILENAME}")

# --- Step 1: Load the data file ---
try:
    # We use 'sep='\s\s+'' to handle the variable number of spaces between columns.
    # 'engine='python'' is required for this type of separator.
    # 'skiprows=1' ignores the first metadata line ("Glucose Data...").
    cgm_df = pd.read_csv(INPUT_FILENAME, sep='\s\s+', engine='python', skiprows=1)
    print("✓ File loaded successfully.")

except FileNotFoundError:
    print(f"\nFATAL ERROR: The file '{INPUT_FILENAME}' was not found.")
    print("Please make sure the script is in the same directory as your data file.")
    sys.exit() # Exit the script
except Exception as e:
    print(f"\nFATAL ERROR: An unexpected error occurred while reading the file: {e}")
    sys.exit()

# --- Step 2: Clean and consolidate the data ---

# Strip any leading/trailing whitespace from the column names
cgm_df.columns = cgm_df.columns.str.strip()

# Combine the 'Scan' and 'Historic' glucose columns into a single column.
# We'll call it 'glucose_mmol_L'.
# The logic: Use the value from 'Scan Glucose mmol/L' if it exists.
# If it's empty (NaN), then use the value from 'Historic Glucose mmol/L'.
cgm_df['glucose_mmol_L'] = cgm_df['Scan Glucose mmol/L'].fillna(cgm_df['Historic Glucose mmol/L'])
print("✓ Glucose columns consolidated.")

# --- Step 3: Format the timestamp ---

# Convert the 'Device Timestamp' column from a string to a proper datetime object.
# 'dayfirst=True' is CRITICAL because your format is DD-MM-YYYY.
cgm_df['timestamp'] = pd.to_datetime(cgm_df['Device Timestamp'], dayfirst=True)
print("✓ Timestamps converted to datetime objects.")

# --- Step 4: Create the final, clean DataFrame ---

# Select only the two columns we need.
# Also, drop any rows where the final glucose value is still missing.
final_df = cgm_df[['timestamp', 'glucose_mmol_L']].dropna().sort_values('timestamp').reset_index(drop=True)
print("✓ Final DataFrame created with 'timestamp' and 'glucose_mmol_L'.")

# --- Step 5: Show the results (head) and file info ---
print("\n--- Cleaned Data Preview (first 5 rows) ---")
print(final_df.head())

print("\n--- Data Information ---")
# .info() is great for checking that the data types are correct (datetime and float).
final_df.info()

# --- Step 6: Save the cleaned data to a new CSV file ---
try:
    # 'index=False' prevents pandas from writing a new row index column.
    final_df.to_csv(OUTPUT_FILENAME, index=False)
    print(f"\n✓ Successfully saved cleaned data to '{OUTPUT_FILENAME}'")
except Exception as e:
    print(f"\nFATAL ERROR: Could not save the file. Reason: {e}")

print("\n--- Script Finished ---")
