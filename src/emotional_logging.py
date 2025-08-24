import csv
import os
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List


@dataclass
class EmotionLogEntry:
    """A data class to represent a single emotional log entry."""
    timestamp: datetime
    valence: int
    arousal: int
    emotion_tags: List[str]
    notes: str


class EmotionTimelineManager:
    """Manages the creation and appending of emotion log entries to a CSV file."""

    def __init__(self, file_path: str):
        """
        Initializes the manager with the path to the CSV file.

        Args:
            file_path: The path to the emotions_timeline.csv file.
        """
        self.file_path = file_path
        self.header = ["timestamp", "valence", "arousal", "emotion_tags", "notes"]

    def add_entry(self, entry: EmotionLogEntry):
        """
        Appends a new emotion log entry to the CSV file.

        Creates the file and writes the header if the file does not exist.

        Args:
            entry: The EmotionLogEntry object to add.
        """
        file_exists = os.path.exists(self.file_path)

        with open(self.file_path, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            if not file_exists:
                writer.writerow(self.header)

            # Prepare data for writing
            entry_dict = asdict(entry)
            # Convert list to comma-separated string
            entry_dict['emotion_tags'] = ",".join(entry.emotion_tags)

            writer.writerow([
                entry_dict['timestamp'].isoformat(),
                entry_dict['valence'],
                entry_dict['arousal'],
                entry_dict['emotion_tags'],
                entry_dict['notes']
            ])


if __name__ == "__main__":
    # This block demonstrates the usage of the EmotionTimelineManager.

    # Define the path for the output file
    csv_file_path = "emotions_timeline.csv"

    # Instantiate the manager
    timeline_manager = EmotionTimelineManager(file_path=csv_file_path)

    # Create a sample entry
    sample_entry = EmotionLogEntry(
        timestamp=datetime.now(),
        valence=6,
        arousal=4,
        emotion_tags=["content", "focused"],
        notes="Felt good after a productive morning session."
    )

    # Add the entry to the timeline
    timeline_manager.add_entry(sample_entry)

    print(f"Successfully added a new entry to {csv_file_path}")

    # Add another entry to demonstrate appending
    another_entry = EmotionLogEntry(
        timestamp=datetime.now(),
        valence=3,
        arousal=7,
        emotion_tags=["anxious", "stressed"],
        notes="Feeling overwhelmed by the upcoming deadline."
    )
    timeline_manager.add_entry(another_entry)
    print(f"Successfully added another entry to {csv_file_path}")
