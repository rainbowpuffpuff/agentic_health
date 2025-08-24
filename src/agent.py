import random
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, List

# --- New Imports for Gemini and .env ---
import google.generativeai as genai
from dotenv import load_dotenv
# ----------------------------------------

# Step 1: Refactor for extensibility
class EmotionRegulationStrategy(ABC):
    """
    An abstract base class for an emotion regulation strategy.
    This is a more generic and extensible replacement for PsychologicalIntervention.
    """
    def __init__(self, name: str, classification: Dict[str, str]):
        self.name = name
        self.classification = classification

    @abstractmethod
    def execute(self, session: 'TherapySession') -> None:
        """
        Executes the emotion regulation strategy on a given session.

        Args:
            session: The TherapySession object to apply the strategy to.
        """
        pass

    def __str__(self):
        return f"{self.name} ({self.classification.get('psychological_function', 'N/A')} - {self.classification.get('orientation', 'N/A')})"

# Step 2: Model the emotion-regulation strategies
class CognitiveReappraisal(EmotionRegulationStrategy):
    """
    A strategy focused on reinterpreting a situation to change its emotional impact.
    This is based on the original script's logic.
    """
    def __init__(self):
        super().__init__(
            name="Cognitive Reappraisal",
            classification={"psychological_function": "Knowledge", "orientation": "Goal-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        """Simulates a cognitive reappraisal dialogue."""
        print(f"\n--- Executing: {self.name} ---")
        print(f"Co-Pilot: I understand you're feeling {session.state['emotion']} about: \"{session.state['problem']}\"")
        print("Co-Pilot: Let's challenge the automatic negative thought: 'I'm a complete failure.'")
        # In a real scenario, this would be interactive. Here, we simulate the user's reflection.
        session.state['outcome'] = "Realized that one mistake doesn't define overall competence."
        session.state['distress_level'] -= 3 # Simulate a reduction in distress
        print(f"Co-Pilot: A more balanced thought might be: '{session.state['outcome']}'")
        print("--- Execution Complete ---")


class EffortfulDistraction(EmotionRegulationStrategy):
    """A strategy focused on diverting attention to a neutral or pleasant activity."""
    def __init__(self):
        super().__init__(
            name="Effortful Distraction",
            classification={"psychological_function": "Attention", "orientation": "Goal-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        """Simulates engaging in a distracting activity."""
        print(f"\n--- Executing: {self.name} ---")
        print(f"Co-Pilot: When you feel {session.state['emotion']}, it can be helpful to engage your mind elsewhere.")
        print("Co-Pilot: Let's try a mentally engaging task, like counting backwards from 100 by 7.")
        # Simulate the effect of the distraction
        session.state['outcome'] = "Temporarily shifted focus away from the distressing thought."
        session.state['distress_level'] -= 2 # Simulate a moderate reduction in distress
        print("--- Execution Complete ---")


class ControlledBreathing(EmotionRegulationStrategy):
    """A strategy focused on regulating the body's physiological response."""
    def __init__(self):
        super().__init__(
            name="Controlled Breathing",
            classification={"psychological_function": "Body", "orientation": "Person-oriented"}
        )

    def execute(self, session: 'TherapySession') -> None:
        """Simulates a guided breathing exercise."""
        print(f"\n--- Executing: {self.name} ---")
        print(f"Co-Pilot: Let's focus on your breath. Breathe in for 4 seconds, hold for 4, and exhale for 6.")
        # Simulate the physiological calming effect
        session.state['outcome'] = "Felt a sense of calm and physical relaxation."
        session.state['distress_level'] -= 4 # Simulate a significant reduction in distress
        print("--- Execution Complete ---")


# --- New Gemini-Powered Strategy ---
class GenerativeReframing(EmotionRegulationStrategy):
    """
    A strategy that uses a generative AI model to provide a novel cognitive reappraisal.
    """
    def __init__(self, model):
        super().__init__(
            name="Generative Reframing (AI)",
            classification={"psychological_function": "Knowledge", "orientation": "Goal-oriented"}
        )
        self.model = model

    def execute(self, session: 'TherapySession') -> None:
        """Generates a new perspective using the Gemini API."""
        print(f"\n--- Executing: {self.name} ---")
        print("Co-Pilot: Let's try to find a new way to look at this situation...")

        prompt = (
            "You are a compassionate therapy co-pilot. "
            f"A user is feeling {session.state['emotion']} because of the following situation: '{session.state['problem']}'.\n\n"
            "Your task is to offer a single, brief, and empowering cognitive reappraisal or a new perspective to help them challenge their negative thoughts. "
            "Provide one concise and helpful reframing of the situation. Do not ask questions, just provide the alternative thought."
        )

        try:
            response = self.model.generate_content(prompt)
            reframe = response.text.strip()
            print(f"Co-Pilot: Here's a different perspective: \"{reframe}\"")
            session.state['outcome'] = reframe
            # We'll assign a high potential for distress reduction for this advanced technique
            session.state['distress_level'] -= 5
        except Exception as e:
            print(f"Co-Pilot: I'm having trouble connecting to my creative circuits right now. Error: {e}")
            session.state['outcome'] = "AI model failed to generate a response."
            # No change in distress if it fails
        finally:
            print("--- Execution Complete ---")
# ------------------------------------


# Step 3: Develop a simulation and evaluation engine
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
        """
        Runs the simulation and returns the outcome.

        Args:
            session: The therapy session to use.
            strategy: The strategy to apply.

        Returns:
            A dictionary containing the final state of the session.
        """
        session.reset()
        strategy.execute(session)
        return session.state


# Step 4: Implement the self-improving agent loop
class SelfImprovingAgent:
    """
    An agent that can simulate different therapeutic strategies to find the most effective one.
    """
    def __init__(self, strategies: List[EmotionRegulationStrategy]):
        self.strategies = strategies
        self.simulator = Simulator()

    def analyze_and_select_best_strategy(self, session: TherapySession) -> EmotionRegulationStrategy:
        """
        Simulates all available strategies and selects the one that leads to the
        greatest reduction in distress. This is the core of the "self-improvement" loop.
        """
        print("\n==================================================")
        print("Agent is analyzing the problem and simulating strategies...")
        print(f"Initial State: {session}")
        print("==================================================")

        outcomes = []
        for strategy in self.strategies:
            simulated_outcome = self.simulator.run(session, strategy)
            outcomes.append({
                "strategy": strategy,
                "final_distress": simulated_outcome['distress_level']
            })
            print(f"  - Simulation result for {strategy.name}: Final Distress = {simulated_outcome['distress_level']}")

        # Determine the best strategy based on which one minimized distress
        best_outcome = min(outcomes, key=lambda x: x['final_distress'])
        best_strategy = best_outcome['strategy']

        print("\n--------------------------------------------------")
        print(f"Analysis Complete. Optimal Strategy Found: {best_strategy.name}")
        print("--------------------------------------------------")

        return best_strategy


# Step 5: Update the main execution block
if __name__ == "__main__":
    # --- Load API Key from .env file ---
    # Construct the path to the .env file in the parent directory
    # __file__ is the path to the current script (e.g., /path/to/root/src/script.py)
    # os.path.dirname(__file__) is the directory of the script (e.g., /path/to/root/src)
    # os.path.join(..., '..') goes one level up to the root directory
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found. Please create a .env file in the root directory.")

    genai.configure(api_key=api_key)
    # ------------------------------------

    # 1. Define the problem
    session = TherapySession(
        problem="I procrastinated on a big project.",
        emotion="overwhelmed and like a failure",
        distress_level=8
    )

    # 2. Create an agent with a set of strategies, including the new Gemini-powered one
    try:
        gemini_model = genai.GenerativeModel('gemini-pro')

        agent = SelfImprovingAgent(strategies=[
            CognitiveReappraisal(),
            EffortfulDistraction(),
            ControlledBreathing(),
            GenerativeReframing(model=gemini_model), # Add the new strategy
        ])

        # 3. The agent analyzes the problem by simulating the strategies
        #    and selects the best one.
        optimal_strategy = agent.analyze_and_select_best_strategy(session)

        # 4. The agent can now apply the chosen strategy for real.
        print("\nAgent: Based on my analysis, the most effective approach is to use:")
        print(f"** {optimal_strategy.name} **")
        print("\nLet's begin...")

        # We reset the session to its original state before the "real" application.
        session.reset()
        optimal_strategy.execute(session)
        print(f"\nFinal Session State: {session}")

    except Exception as e:
        print(f"\nAn error occurred during agent execution: {e}")
        print("Please check your API key and network connection.")
