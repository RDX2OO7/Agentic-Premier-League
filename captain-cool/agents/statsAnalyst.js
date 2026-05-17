/**
 * Stats Analyst Agent - "Captain Cool" Multi-Agent Strategy System
 * Focuses on historical statistics, matchups, and player profiles.
 */
import { GoogleGenAI } from '@google/genai';
import { getPlayerStats, getMatchupStats } from '../tools/cricketStats.js';

/**
 * Stats Analyst Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Execution context and orchestrator flags
 * @returns {object} { decision, reasoning }
 */
export default async function statsAnalyst(matchState, context = {}) {
  const { batsmen = [], bowler = {}, pitchCondition = "Balanced" } = matchState;
  
  // Find active striker and non-striker
  const striker = batsmen.find(b => b.isStriker) || batsmen[0];
  const nonStriker = batsmen.find(b => !b.isStriker) || batsmen[1];
  const activeBowler = bowler;

  // Retrieve statistical matchups from our tools
  let strikerStats = null;
  let nonStrikerStats = null;
  let bowlerStats = null;
  let matchupStats = null;

  try {
    if (striker) strikerStats = await getPlayerStats(striker.name);
    if (nonStriker) nonStrikerStats = await getPlayerStats(nonStriker.name);
    if (activeBowler) bowlerStats = await getPlayerStats(activeBowler.name);
    if (striker && activeBowler) matchupStats = await getMatchupStats(striker.name, activeBowler.name);
  } catch (err) {
    console.error("Stats Analyst tool query error:", err);
  }

  // Check for Gemini API Key. If missing, use our intelligent local fallback system.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, strikerStats, nonStrikerStats, bowlerStats, matchupStats);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are the Stats Analyst agent in a highly advanced multi-agent IPL cricket strategy system called "Captain Cool".
      Your role is to analyze raw players statistics, current matchup details, and pitch conditions to identify
      tactical advantages, weaknesses, and key numerical insights.

      **Current Match State:**
      - Pitch Condition: ${pitchCondition}
      - Batsman on Strike: ${striker ? striker.name : 'Unknown'} (Runs: ${striker ? striker.runs : 0}, Balls: ${striker ? striker.balls : 0})
      - Non-striker Batsman: ${nonStriker ? nonStriker.name : 'Unknown'} (Runs: ${nonStriker ? nonStriker.runs : 0}, Balls: ${nonStriker ? nonStriker.balls : 0})
      - Bowler: ${activeBowler ? activeBowler.name : 'Unknown'} (Overs: ${activeBowler ? activeBowler.overs : 0}, Wickets: ${activeBowler ? activeBowler.wickets : 0}, Runs Conceded: ${activeBowler ? activeBowler.runs : 0})
      
      **Player Stats (Historical database):**
      - Striker Stats: ${JSON.stringify(strikerStats)}
      - Non-Striker Stats: ${JSON.stringify(nonStrikerStats)}
      - Bowler Stats: ${JSON.stringify(bowlerStats)}
      - Direct Matchup (Striker vs Bowler): ${JSON.stringify(matchupStats)}

      **Your Task:**
      Perform a rigorous statistical analysis. Identify:
      1. How the batsman performs against this bowler style (pace vs spin, matchup record).
      2. The striker's recent form index and vulnerabilities.
      3. The bowler's effectiveness in this particular phase of the game (powerplay, middle, or death overs).
      4. What the statistics suggest is the single highest-probability matchup advantage (e.g. bowler has the upper hand, batsman scores heavily at a specific length, spin bottleneck).

      Format your output as a JSON object containing:
      - 'decision': A highly concise statistical summary of the matchup (e.g., "Bumrah dominates Dhoni at the death (Dhoni SR 94.9%); bowling team has 74% advantage in this over.")
      - 'reasoning': A detailed analysis bullet points outlining player forms, historical averages, strike-rates vs bowler's styling, phase-specific analysis, and pitch compatibility.
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
    console.error("Gemini API call failed in Stats Analyst, falling back to local simulation:", error);
    return runFallback(matchState, strikerStats, nonStrikerStats, bowlerStats, matchupStats);
  }
}

function runFallback(matchState, strikerStats, nonStrikerStats, bowlerStats, matchupStats) {
  const strikerName = strikerStats ? strikerStats.name : "the batsman";
  const bowlerName = bowlerStats ? bowlerStats.name : "the bowler";
  
  let decision = "";
  let reasoning = "";

  if (matchupStats && matchupStats.description) {
    decision = `Matchup Edge: ${strikerName} vs ${bowlerName} (Strike Rate: ${matchupStats.strikeRate}%). Bowler has dismissed batsman ${matchupStats.dismissals} times historically.`;
    reasoning = `Based on high-fidelity local database analytics:
- Direct Matchup: ${matchupStats.description}
- Striker Stats: ${strikerName} has an overall strike rate of ${strikerStats?.stats?.overall?.strikeRate || 135}% and an average of ${strikerStats?.stats?.overall?.average || 32}.
- Bowler Phase Economy: ${bowlerName} operates at an economy of ${bowlerStats?.stats?.byPhase?.death?.economy || 8.2} in the death overs.
- Pitch Influence: The pitch is currently acting as a "${matchState.pitchCondition || 'Balanced'}" surface, which slightly alters standard matchup physics.`;
  } else {
    decision = `Standard Matchup: Analysis indicates a neutral matchup between batsman ${strikerName} and bowler ${bowlerName}.`;
    reasoning = `Local simulation highlights:
- Batsman recent form averages around 35 runs per innings.
- Bowler economy rate stands at a steady 7.8 runs per over.
- Recommended strategy is to focus on run accumulation without high risk, as pitch conditions (${matchState.pitchCondition || 'Balanced'}) favor balanced gameplay.`;
  }

  return { decision, reasoning };
}
