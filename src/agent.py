from abc import ABC, abstractmethod

class PsychologicalIntervention(ABC):
    """An abstract base class for psychological interventions."""

    @abstractmethod
    def execute(self, session_data: dict) -> None:
        """
        Executes the psychological intervention.

        Args:
            session_data: A dictionary containing session data.
        """
        pass
