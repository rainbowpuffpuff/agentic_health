import random
import os
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List

# --- Imports for Gemini and .env ---
import google.generativeai as genai
from dotenv import load_dotenv

# --- Step 1: Base Class for Emotion Regulation Strategies ---
# This framework is grounded in the taxonomy proposed by Sander L. Koole in his 2009 integrative review,
# "The psychology of emotion regulation: An integrative review".
class EmotionRegulationStrategy(ABC):
    """
    An abstract base class for an emotion regulation strategy.
    Each strategy is classified by its 'target' (the emotion-generating system it acts on)
    and its 'function' (the psychological purpose it serves), based on Koole (2009).
    """
    def __init__(self, name: str, classification: Dict[str, str]):
        self.name = name
        self.classification = classification

    @abstractmethod
    def execute(self, session: 'TherapySession') -> None:
        """
        Executes the emotion regulation strategy on a given session.
        This method is now NON-INTERACTIVE for dataset generation.
        """
        pass

    def __str__(self):
        # Updated string representation to use Koole's terminology
        return (f"{self.name} (Target: {self.classification.get('target', 'N/A')} | "
                f"Function: {self.classification.get('function', 'N/A')})")

# --- Step 2: Implement a Diverse Set of NON-INTERACTIVE Strategies ---

class CognitiveReappraisal(EmotionRegulationStrategy):
    """A strategy focused on reinterpreting a situation to change its emotional impact."""
    def __init__(self):
        super().__init__(
            name="Cognitive Reappraisal",
            classification={"target": "Knowledge", "function": "Goal-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: I understand you're feeling {session.state['emotion']} about: \"{session.state['problem']}\"")
        negative_thought = "I'm a complete failure." # Simulated input
        print(f"Simulated User Thought: {negative_thought}")

        reframe_input = "Procrastinating on one deadline doesn't make me a complete failure." # Simulated input
        print(f"Simulated User Reframe: {reframe_input}")

        session.state['outcome'] = reframe_input
        session.state['distress_level'] -= 3
        print(f"\nCo-Pilot: That's a great reframe. Holding onto the thought '{reframe_input}' can definitely help reduce the emotional burden.")
        print("\n--- Execution Complete ---")


class EffortfulDistraction(EmotionRegulationStrategy):
    """A strategy focused on diverting attention to a neutral or pleasant activity."""
    def __init__(self):
        super().__init__(
            name="Effortful Distraction",
            classification={"target": "Attention", "function": "Goal-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: When feeling {session.state['emotion']}, it helps to engage your mind completely in something else.")
        print("Co-Pilot: We'll try a simple mental exercise. I want you to name 5 things you can see, 4 things you can feel, 3 you can hear, 2 you can smell, and 1 you can taste.")
        print("Simulating '5-4-3-2-1' grounding exercise...")

        print("\nCo-Pilot: Well done. This exercise helps anchor you in the present moment.")
        session.state['outcome'] = "Successfully shifted focus away from the distressing thought using a grounding technique."
        session.state['distress_level'] -= 2
        print("\n--- Execution Complete ---")


class ControlledBreathing(EmotionRegulationStrategy):
    """A strategy focused on regulating the body's physiological response."""
    def __init__(self):
        super().__init__(
            name="Controlled Breathing",
            classification={"target": "Body", "function": "Person-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print("Co-Pilot: Let's calm your nervous system with a box breathing exercise.")
        print("Co-Pilot: We will inhale for 4 counts, hold for 4, exhale for 4, and hold for 4.")
        print("Simulating 3 cycles of box breathing...")

        print("\nCo-Pilot: Excellent. Notice the change in your physical state.")
        session.state['outcome'] = "Felt a sense of calm and physical relaxation."
        session.state['distress_level'] -= 4
        print("\n--- Execution Complete ---")


class GenerativeReframing(EmotionRegulationStrategy):
    """A strategy that uses a generative AI model to provide a novel cognitive reappraisal."""
    def __init__(self, client: 'genai.GenerativeModel'):
        super().__init__(
            name="Generative Reframing (AI)",
            classification={"target": "Knowledge", "function": "Goal-oriented"}
        )
        self.client = client

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print("Co-Pilot: Let's connect to our creative AI to find a new way to look at this situation...")

        prompt = (
            "You are a compassionate therapy co-pilot. "
            f"A user is feeling {session.state['emotion']} because of the following situation: '{session.state['problem']}'.\n\n"
            "Your task is to offer a single, brief, and empowering cognitive reappraisal or a new perspective to help them challenge their negative thoughts. "
            "Provide one concise and helpful reframing of the situation. Do not ask questions, just provide the alternative thought."
        )

        try:
            response = self.client.generate_content(contents=prompt)
            reframe = response.text.strip()
            print(f"Co-Pilot: Here's a different perspective for you to consider: \n\n\"{reframe}\"")
            session.state['outcome'] = reframe
            session.state['distress_level'] -= 5
        except Exception as e:
            print(f"Co-Pilot: I'm having trouble connecting to my creative circuits right now. Error: {e}")
            session.state['outcome'] = "AI model failed to generate a response."
        finally:
            print("\n--- Execution Complete ---")


class ProblemSolving(EmotionRegulationStrategy):
    """A strategy to identify and take actionable steps to resolve the root problem."""
    def __init__(self):
        super().__init__(
            name="Problem-Solving",
            classification={"target": "Behavior", "function": "Goal-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: Sometimes, feeling {session.state['emotion']} comes from feeling stuck.")
        action_step = "Break down the project into smaller tasks." # Simulated input
        print(f"Simulated Action Step: {action_step}")

        session.state['outcome'] = f"Identified a manageable first step: '{action_step}'."
        session.state['distress_level'] -= 3
        print(f"\nCo-Pilot: That's a perfect step. Focusing on '{action_step}' can restore a sense of agency.")
        print("\n--- Execution Complete ---")


class MindfulObservation(EmotionRegulationStrategy):
    """A strategy focused on non-judgmentally observing one's internal experience."""
    def __init__(self):
        super().__init__(
            name="Mindful Observation",
            classification={"target": "Attention", "function": "Person-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: Instead of fighting the feeling of {session.state['emotion']}, let's just observe it with curiosity.")
        print("Simulating non-judgmental observation of feelings and thoughts...")

        session.state['outcome'] = "Observed thoughts and feelings without judgment, creating distance from them."
        session.state['distress_level'] -= 2
        print("\nCo-Pilot: By observing without reacting, you can reduce the power these feelings have over you.")
        print("\n--- Execution Complete ---")


class Acceptance(EmotionRegulationStrategy):
    """A strategy that involves acknowledging and making space for difficult emotions."""
    def __init__(self):
        super().__init__(
            name="Acceptance",
            classification={"target": "Knowledge", "function": "Person-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: It's understandable to feel {session.state['emotion']} in this situation. It is a valid human emotion.")
        print("Simulating the act of allowing the feeling to be present without resistance...")

        session.state['outcome'] = "Allowed the emotion to be present without resistance, which reduced internal struggle."
        session.state['distress_level'] -= 3
        print("\nCo-Pilot: By accepting the feeling, you've stopped the secondary struggle with it. This is a powerful step.")
        print("\n--- Execution Complete ---")


class HedonicIndulgence(EmotionRegulationStrategy):
    """A strategy aimed at immediate gratification to improve feeling state, as per Koole (2009)."""
    def __init__(self):
        super().__init__(
            name="Hedonic Indulgence",
            classification={"target": "Body", "function": "Hedonic"}
        )

    def execute(self, session: 'TherapySession') -> None:
        print(f"\n--- Executing: {self.name} ---\n")
        print(f"Co-Pilot: When distress is high, sometimes the goal is just to feel better right now.")
        indulgence = "listen to a favorite song" # Simulated input
        print(f"Simulated Indulgence: {indulgence}")

        session.state['outcome'] = f"Chose to engage in a pleasant activity ('{indulgence}') for immediate mood improvement."
        session.state['distress_level'] -= 2
        print(f"\nCo-Pilot: Great. Taking a moment for '{indulgence}' can provide a quick emotional lift.")
        print("\n--- Execution Complete ---")


# --- Step 3: Simulation and Evaluation Engine ---
class TherapySession:
    """Manages the state of a simulated therapy session."""
    def __init__(self, problem: str, emotion: str, distress_level: int):
        self.initial_state = {
            "problem": problem,
            "emotion": emotion,
            "distress_level": distress_level,
            "outcome": None,
        }
        self.state = self.initial_state.copy()

    def reset(self):
        """Resets the session to its initial state for a new simulation."""
        self.state = self.initial_state.copy()

    def __str__(self):
        return (f"Problem: \"{self.state['problem']}\" | "
                f"Emotion: {self.state['emotion']} | "
                f"Distress: {self.state['distress_level']}/10")


class Simulator:
    """Runs a simulation of a therapy session with a given strategy."""
    def run(self, session: TherapySession, strategy: EmotionRegulationStrategy) -> Dict[str, Any]:
        session.reset()
        # Simulation logic directly applies distress reduction for analysis
        if "Generative Reframing" in strategy.name:
            session.state['distress_level'] -= 5
        elif "Breathing" in strategy.name:
            session.state['distress_level'] -= 4
        elif "Reappraisal" in strategy.name or "Problem-Solving" in strategy.name or "Acceptance" in strategy.name:
            session.state['distress_level'] -= 3
        elif "Hedonic Indulgence" in strategy.name or "Effortful Distraction" in strategy.name or "Mindful Observation" in strategy.name:
            session.state['distress_level'] -= 2
        else:
            session.state['distress_level'] -= 2
        return session.state


# --- Step 4: The Self-Improving Agent ---
class SelfImprovingAgent:
    """
    An agent that simulates different strategies to find the most effective one.
    """
    def __init__(self, strategies: List[EmotionRegulationStrategy]):
        self.strategies = strategies
        self.simulator = Simulator()

    def analyze_and_select_best_strategy(self, session: TherapySession) -> EmotionRegulationStrategy:
        print("\n==================================================")
        print("Agent is analyzing the problem and simulating strategies based on the Koole (2009) framework...")
        print(f"Initial State: {session}")
        print("==================================================")

        outcomes = []
        for strategy in self.strategies:
            simulated_outcome = self.simulator.run(session, strategy)
            outcomes.append({
                "strategy": strategy,
                "final_distress": simulated_outcome['distress_level']
            })
            print(f"  - Simulation for {strategy}: Final Distress = {simulated_outcome['distress_level']}")

        best_outcome = min(outcomes, key=lambda x: x['final_distress'])
        best_strategy = best_outcome['strategy']

        print("\n--------------------------------------------------")
        print(f"Analysis Complete. Optimal Strategy Found: {best_strategy.name}")
        print("--------------------------------------------------\n")

        return best_strategy

# --- Step 5: Main Interactive Simulation Loop (To be refactored) ---
def main():
    """Main function to run the simulation."""
    try:
        load_dotenv()
    except Exception as e:
        print(f"Warning: Could not load .env file. {e}")

    api_key = os.getenv("GEMINI_API_KEY")

    strategies = [
        CognitiveReappraisal(),
        EffortfulDistraction(),
        ControlledBreathing(),
        ProblemSolving(),
        MindfulObservation(),
        Acceptance(),
        HedonicIndulgence()
    ]

    if api_key and api_key not in ["", "YOUR_API_KEY_HERE"]:
        print("\nGEMINI_API_KEY found. Initializing Generative AI strategy.")
        try:
            genai.configure(api_key=api_key)
            model_client = genai.GenerativeModel(model_name="gemini-1.5-flash")
            strategies.append(GenerativeReframing(client=model_client))
        except Exception as e:
            print(f"Failed to initialize Generative AI strategy: {e}")
    else:
        print("\nGEMINI_API_KEY not found or is a placeholder. Skipping Generative AI strategy.")

    agent = SelfImprovingAgent(strategies=strategies)

    # This is now a single, non-interactive run for demonstration
    print("\n--- Running a single automated session for dataset generation ---")
    session = TherapySession(
        problem="Feeling overwhelmed about an upcoming presentation.",
        emotion="anxious and stressed",
        distress_level=8
    )

    optimal_strategy = agent.analyze_and_select_best_strategy(session)

    print(f"Agent: Based on my analysis, the most effective approach appears to be ** {optimal_strategy.name} **.")
    print(f"This is a {optimal_strategy.classification.get('function')} strategy that targets your {optimal_strategy.classification.get('target')}.")

    # The execution is just for show in the console, the main goal is the analysis log
    session.reset()
    optimal_strategy.execute(session)
    print(f"\nFinal Session State: {session}")

if __name__ == "__main__":
    main()
