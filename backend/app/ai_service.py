import json
import os
import httpx
from typing import List, Dict, Any, Optional
from .models import Shot

class AIGenerationError(Exception):
    """Custom exception for AI generation errors"""
    pass

class ClaudeAIService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-sonnet-4-20250514"  # Using Claude Sonnet 4
        
        # Valid positions
        self.horizontal_positions = ['Left', 'Center Left', 'Center', 'Center Right', 'Right']
        self.depth_positions = ['Back', 'Mid Back', 'Mid', 'Mid Front', 'Front']

    def get_sport_context(self, sport: str) -> Dict[str, Any]:
        """Get sport-specific context and terminology"""
        contexts = {
            "badminton": {
                "court_description": "badminton court with forecourt (front), midcourt (mid), and backcourt (back) areas",
                "shot_types": "clear, drop, smash, net shot, drive, lift",
                "tactical_concepts": "attacking from the back, net play, deception, court coverage",
                "space_description": "Space 1 and Space 2 represent the two halves of the court separated by the net",
                "shot_constraints": {
                    "smash": "Smashes are powerful attacking shots that typically cannot land in the front court (Front, Mid Front positions). They usually land in Mid, Mid Back, or Back positions due to their steep downward trajectory.",
                    "clear": "Clears are defensive/neutral shots hit high and deep, typically landing in Back or Mid Back positions",
                    "drop": "Drop shots are finesse shots that can land anywhere but are most effective in Mid Front and Front positions",
                    "net": "Net shots must land in Front or Mid Front positions by nature of the shot",
                    "drive": "Drives are fast, flat shots typically landing in Mid to Mid Back positions",
                    "lift": "Lifts are defensive shots from the front court, usually targeting Back or Mid Back positions"
                }
            },
            "tennis": {
                "court_description": "tennis court with baseline (back), service boxes (mid), and net area (front)",
                "shot_types": "groundstroke, volley, serve, approach shot, passing shot, lob",
                "tactical_concepts": "baseline rallies, net approaches, court positioning, point construction",
                "space_description": "Space 1 and Space 2 represent the two halves of the court separated by the net"
            },
            "volleyball": {
                "court_description": "volleyball court with back row (back), middle (mid), and front row (front) positions",
                "shot_types": "spike, set, dig, serve, block, tip",
                "tactical_concepts": "attack patterns, defensive positioning, rotation systems",
                "space_description": "Space 1 and Space 2 represent the two halves of the court separated by the net"
            },
            "table_tennis": {
                "court_description": "table tennis table with back (far from net), middle, and front (near net) areas",
                "shot_types": "topspin, backspin, sidespin, smash, push, flick",
                "tactical_concepts": "spin variation, placement, speed control, footwork patterns",
                "space_description": "Space 1 and Space 2 represent the two halves of the table separated by the net"
            },
            "pickleball": {
                "court_description": "pickleball court with baseline (back), non-volley zone/kitchen (mid), and net area (front)",
                "shot_types": "dink, drive, lob, drop shot, volley, serve, third shot drop",
                "tactical_concepts": "soft game at kitchen, power from baseline, court positioning, patience",
                "space_description": "Space 1 and Space 2 represent the two halves of the court separated by the net"
            }
        }
        
        return contexts.get(sport.lower(), contexts["badminton"])  # Default to badminton

    def _format_shot_constraints(self, sport_context: Dict[str, Any]) -> str:
        """Format sport-specific shot constraints for the prompt"""
        if "shot_constraints" not in sport_context:
            return "No specific shot constraints for this sport."
        
        constraints = sport_context["shot_constraints"]
        formatted = []
        for shot_type, constraint in constraints.items():
            formatted.append(f"- {shot_type.upper()}: {constraint}")
        
        return "\n".join(formatted)

    def create_generation_prompt(self, sport: str, purpose: str, num_shots: int, 
                                min_distance: Optional[float] = None, 
                                max_distance: Optional[float] = None) -> str:
        """Create a sport-specific prompt for shot sequence generation"""
        
        sport_context = self.get_sport_context(sport)
        
        distance_constraint = ""
        if min_distance is not None or max_distance is not None:
            min_dist = min_distance if min_distance is not None else 0
            max_dist = max_distance if max_distance is not None else "unlimited"
            distance_constraint = f"""
IMPORTANT DISTANCE CONSTRAINTS:
- Each consecutive shot must be between {min_dist} and {max_dist} grid units apart
- Distance is calculated using Euclidean distance on a 5x10 continuous grid
- Space 1: coordinates (0-4, 0-4) where y=4 is front
- Space 2: coordinates (0-4, 5-9) where y=5 is front (flipped layout)
- Consider distance carefully when selecting positions
"""

        prompt = f"""You are an expert {sport} coach creating a strategic shot sequence for training purposes.

TRAINING OBJECTIVE: {purpose}

SPORT CONTEXT: 
- Sport: {sport}
- Court: {sport_context['court_description']}
- Common shots: {sport_context['shot_types']}
- Tactical focus: {sport_context['tactical_concepts']}
- Space layout: {sport_context['space_description']}

SPORT-SPECIFIC SHOT CONSTRAINTS:
{self._format_shot_constraints(sport_context)}

SEQUENCE REQUIREMENTS:
- Generate exactly {num_shots} shots
- Shots must alternate between Space 1 and Space 2 (starting with Space 1)
- Each shot must have valid positions from the allowed lists below
- IMPORTANT: Respect sport-specific shot constraints above when selecting positions{distance_constraint}

POSITION SYSTEM:
Horizontal positions: {', '.join(self.horizontal_positions)}
Depth positions: {', '.join(self.depth_positions)}

Grid Layout (for distance calculations):
```
Space 1:           Space 2:
Back    (y=0)      Front   (y=5)
Mid Back(y=1)      Mid Front(y=6)  
Mid     (y=2)      Mid     (y=7)
Mid Front(y=3)     Mid Back(y=8)
Front   (y=4)      Back    (y=9)
Left CL C CR Right Left CL C CR Right
(x=0-4)            (x=0-4)
```

STRATEGIC CONSIDERATIONS:
Based on the training objective "{purpose}", create a sequence that:
1. Supports the specific training goal
2. Creates realistic {sport} patterns
3. Provides appropriate challenge progression
4. Maintains tactical coherence

OUTPUT FORMAT:
Respond with ONLY a valid JSON array of shot objects. Each shot must have exactly these fields:
- "horizontal": one of {self.horizontal_positions}
- "depth": one of {self.depth_positions}  
- "space": 1 or 2 (alternating, starting with 1)

Example format:
[
  {{"horizontal": "Center", "depth": "Back", "space": 1}},
  {{"horizontal": "Left", "depth": "Front", "space": 2}}
]

Generate the sequence now:"""

        return prompt

    async def generate_sequence(self, sport: str, purpose: str, num_shots: int,
                              min_distance: Optional[float] = None,
                              max_distance: Optional[float] = None) -> List[Shot]:
        """Generate a shot sequence using Claude AI"""
        
        if not (1 <= num_shots <= 100):
            raise AIGenerationError("Number of shots must be between 1 and 100")
        
        prompt = self.create_generation_prompt(sport, purpose, num_shots, min_distance, max_distance)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 2000,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    }
                )
                
                if response.status_code != 200:
                    raise AIGenerationError(f"API request failed: {response.status_code} - {response.text}")
                
                result = response.json()
                content = result["content"][0]["text"]
                
                # Parse and validate the JSON response
                shots_data = self._parse_and_validate_response(content, num_shots)
                
                # Convert to Shot objects
                shots = [Shot(**shot) for shot in shots_data]
                
                return shots
                
        except httpx.TimeoutException:
            raise AIGenerationError("Request to AI service timed out")
        except httpx.RequestError as e:
            raise AIGenerationError(f"Network error: {str(e)}")
        except Exception as e:
            raise AIGenerationError(f"Failed to generate sequence: {str(e)}")

    def _parse_and_validate_response(self, content: str, expected_shots: int) -> List[Dict[str, Any]]:
        """Parse and validate the AI response"""
        try:
            # Try to extract JSON from the response
            content = content.strip()
            
            # Find JSON array in the response
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON array found in response")
            
            json_str = content[start_idx:end_idx]
            shots_data = json.loads(json_str)
            
            if not isinstance(shots_data, list):
                raise ValueError("Response must be a JSON array")
            
            if len(shots_data) != expected_shots:
                raise ValueError(f"Expected {expected_shots} shots, got {len(shots_data)}")
            
            # Validate each shot
            for i, shot in enumerate(shots_data):
                self._validate_shot(shot, i + 1)
                
                # Check space alternation
                expected_space = (i % 2) + 1
                if shot.get("space") != expected_space:
                    raise ValueError(f"Shot {i + 1}: Expected space {expected_space}, got {shot.get('space')}")
            
            return shots_data
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in response: {str(e)}")
        except Exception as e:
            raise ValueError(f"Response validation failed: {str(e)}")

    def _validate_shot(self, shot: Dict[str, Any], shot_number: int) -> None:
        """Validate a single shot object"""
        required_fields = ["horizontal", "depth", "space"]
        
        for field in required_fields:
            if field not in shot:
                raise ValueError(f"Shot {shot_number}: Missing required field '{field}'")
        
        horizontal = shot["horizontal"]
        depth = shot["depth"]
        space = shot["space"]
        
        if horizontal not in self.horizontal_positions:
            raise ValueError(f"Shot {shot_number}: Invalid horizontal position '{horizontal}'")
        
        if depth not in self.depth_positions:
            raise ValueError(f"Shot {shot_number}: Invalid depth position '{depth}'")
        
        if space not in [1, 2]:
            raise ValueError(f"Shot {shot_number}: Invalid space '{space}', must be 1 or 2")

# Global instance - lazy initialization
ai_service = None

def get_ai_service():
    global ai_service
    if ai_service is None:
        ai_service = ClaudeAIService()
    return ai_service