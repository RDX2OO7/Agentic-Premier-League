/**
 * Commentator Agent - "Captain Cool" Multi-Agent Strategy System
 * Translates technical strategies, calculations, and debates into high-octane,
 * legendary cricket broadcast commentary (ala Harsha Bhogle, Ravi Shastri, and Tony Greig).
 */
import { GoogleGenAI } from '@google/genai';

/**
 * Commentator Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains refinedStrategy, initialStrategy, devilsAdvocateCritique, statsAnalysis, winProbability)
 * @returns {object} { decision, reasoning }
 */
export default async function commentator(matchState, context = {}) {
  const {
    refinedStrategy = "",
    initialStrategy = "",
    devilsAdvocateCritique = "",
    statsAnalysis = "",
    winProbability = null
  } = context;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are the legendary Commentator agent in the "Captain Cool" IPL strategy system.
      Your job is to translate complex technical tactics, statistics, and multi-agent debates into
      a highly theatrical, electrifying, and colorful cricket commentary (blending the poetic, analytical style
      of Harsha Bhogle, the raw thunderous energy of Ravi Shastri, and the enthusiastic flair of Tony Greig).

      **The Strategic Context of the Match:**
      - Score: ${matchState.runs}/${matchState.wickets} in ${matchState.overs} overs (Target: ${matchState.target || "N/A"})
      - Batting Team: ${matchState.battingTeam} (Striker: ${matchState.batsmen?.[0]?.name || "Batsman"})
      - Bowling Team: ${matchState.bowlingTeam} (Bowler: ${matchState.bowler?.name || "Bowler"})
      - Win Probability: Batting ${winProbability?.battingWinProb}% vs Bowling ${winProbability?.bowlingWinProb}%
      - Recent Play: [${(matchState.recentDeliveries || []).join(', ')}]

      **The Tactical Room Debate:**
      - Stats Analyst Findings: "${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}"
      - Strategist's Initial Proposal: "${typeof initialStrategy === 'object' ? JSON.stringify(initialStrategy) : initialStrategy}"
      - Devil's Advocate's Skeptical Challenge: "${typeof devilsAdvocateCritique === 'object' ? JSON.stringify(devilsAdvocateCritique) : devilsAdvocateCritique}"
      - Captain Cool's Refined Final Tactic: "${typeof refinedStrategy === 'object' ? JSON.stringify(refinedStrategy) : refinedStrategy}"

      **Your Commentary Task:**
      Perform a highly dramatic and engaging broadcast commentary. 
      - Set the high-voltage atmosphere.
      - Describe the matchup as a classic chess match. 
      - Playfully mention the internal battle: how the "Devil's Advocate" challenged the original plan, and how "Captain Cool" calmly adjusted the pieces.
      - Inject signature cricket phrases (e.g., "In the air... and taken!", "Like a tracer bullet!", "Absolutely electric!", "He's parsed the gap!", "This is going down to the wire!").
      - Make it sound authentic, descriptive, and absolute gold for a cricket fanatic.

      Format your output as a JSON object containing:
      - 'decision': A thrilling, high-energy commentary headline (e.g., "Ravi Shastri: 'IT'S A HOCKEY STICK BATTLE AT THE DEATH! Dhoni vs Bumrah! WHO WILL BLINK FIRST?!'")
      - 'reasoning': The full broadcast commentary transcript (use formatting like "[Harsha Bhogle]: ...", "[Ravi Shastri]: ...").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            decision: { type: 'STRING' },
            reasoning: { type: 'STRING' }
          },
          required: ['decision', 'reasoning']
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return {
      decision: result.decision,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error("Gemini API call failed in Commentator, falling back to local simulation:", error);
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const {
    refinedStrategy = {},
    devilsAdvocateCritique = {},
    winProbability = {}
  } = context;

  const strikerName = matchState.batsmen?.[0]?.name || "Batsman";
  const bowlerName = matchState.bowler?.name || "Bowler";
  const batWin = winProbability.battingWinProb || 50;
  const bowlWin = winProbability.bowlingWinProb || 50;

  const decision = `[Ravi Shastri]: "CHESS ON A CRICKET PITCH! ${matchState.bowlingTeam} preset the trap, but ${matchState.battingTeam} are sharpening their swords! BUCKLE UP, FOLKS!"`;
  
  const reasoning = `[Ravi Shastri]: "Welcome back, folks! We are at the business end of this absolute nail-biter! The atmosphere is electric, the fans are on the edge of their seats, and the calculators are out! 
  
  [Harsha Bhogle]: "It's fascinating, Ravi. The strategist originally wanted a highly aggressive bowling charge, but the technical room went wild! The Devil's Advocate pointed out a massive vulnerability: '${devilsAdvocateCritique.decision || 'tail-end risks'}'. And what does Captain Cool do? He calmly nods, pivots, and sets up a refined squeeze play: '${refinedStrategy.decision || 'defensive rotation'}'. It's pure intellect on display!

  [Ravi Shastri]: "That's Dhoni-style captaincy for you, Harsha! No panic, just ice in the veins! The win predictor has got it at ${batWin}% for the chase and ${bowlWin}% for the defense. One delivery could change the course of IPL history! Let's see who holds their nerve as ${bowlerName} runs in to bowl to ${strikerName}! IT'S GAME ON!"`;

  return { decision, reasoning };
}
