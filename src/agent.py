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


class CBTIntervention(PsychologicalIntervention):
    """A concrete implementation of a CBT intervention."""

    def execute(self, session_data: dict) -> None:
        """
        Executes the CBT intervention.
        """
        print("Co-Pilot: Acknowledging your problem...")
        print(f"Co-Pilot: I understand you're feeling overwhelmed about procrastinating on your project: \"{session_data['problem']}\"")
        print("Co-Pilot: What is the automatic negative thought you are having?")
        print("Imaginary User: I'm a complete failure.")
        print("Co-Pilot: What is the evidence for this thought?")
        print("Imaginary User: I missed the deadline.")
        print("Co-Pilot: What is the evidence against this thought?")
        print("Imaginary User: I completed the other parts of the project well. My boss gave me good feedback last week.")
        print("Co-Pilot: Now, let's try to formulate a more balanced thought.")
        print("Imaginary User: Procrastinating on one deadline doesn't make me a complete failure. It means I need to manage my time better on this specific type of task.")


if __name__ == "__main__":
    simulated_session = {'problem': 'I procrastinated on a big project and now I feel overwhelmed and like a failure.'}
    cbt_intervention = CBTIntervention()
    cbt_intervention.execute(simulated_session)
