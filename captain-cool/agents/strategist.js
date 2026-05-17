/**
 * Strategist Agent - "Captain Cool" Multi-Agent Strategy System
 * Acts as the master strategist (representing Captain Cool's brain). Takes inputs from the
 * Stats Analyst, Win Probability tool, and refines decisions based on the Devil's Advocate critique.
 */
import { GoogleGenAI } from '@google/genai';

/**
 * Strategist Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains statsAnalysis, winProbability, devilsAdvocateCritique)
 * @returns {object} { decision, reasoning }
 */
export default async function strategist(matchState, context = {}) {
  const { statsAnalysis = "", winProbability = null, devilsAdvocateCritique = "" } = context;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Determine if this is an initial plan or a refinement round
    const isRefining = !!devilsAdvocateCritique;

    let systemInstructions = `
      You are the Strategist agent, the master brain called "Captain Cool" (inspired by calm, calculating leaders like MS Dhoni).
      Your goal is to formulate highly successful tactical cricket decisions (bowling rotations, batsman pacing, field setups, risk index).
      You are pragmatic, mathematically sound, psychologically sharp, and always calm under pressure.
    `;

    let prompt = `
      **Match Context:**
      - Batting Team: ${matchState.battingTeam}
      - BowlingTeam: ${matchState.bowlingTeam}
      - Innings: ${matchState.innings}
      - Score: ${matchState.runs}/${matchState.wickets} in ${matchState.overs} overs
      - Target: ${matchState.target || "N/A"}
      - Pitch Condition: ${matchState.pitchCondition}
      - Recent Ball History: [${(matchState.recentDeliveries || []).join(', ')}]

      **Stats Analyst Insights:**
      ${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}

      **Win Probability Tool Metrics:**
      ${winProbability ? JSON.stringify(winProbability) : "Calculating..."}
    `;

    if (isRefining) {
      prompt += `
      =========================================
      ⚠️ **CRITICAL CHALLENGE (Devil's Advocate Critique):**
      "${devilsAdvocateCritique}"
      =========================================
      
      **Refinement Assignment:**
      The Devil's Advocate has identified severe flaws or blind spots in your initial proposal.
      Re-evaluate your position. You must either:
      1. **Acknowledge and Pivot**: Adjust your tactic to address the critique (e.g. hold the bowler back, play defensively).
      2. **Stand Firm with Rigorous Reasoning**: Counter-argue why your original path is still the mathematically or psychologically superior choice.

      Refine your strategic decision, integrating or refuting the critique.
      `;
    } else {
      prompt += `
      **Initial Strategic Task:**
      Develop a complete strategy for the next over. Outline:
      1. The specific action (e.g., bowling change to a spin bowler, change in field positions, batsman targeting a specific bowler).
      2. The pacing / aggression level (e.g., "Batsman should play defensively and target the bowler's 5th ball", "Bowler should maintain a defensive yorker line").
      3. Field placement recommendation (e.g., "Bring third-man in, push deep mid-wicket back").
      `;
    }

    prompt += `
      Format your response as a JSON object containing:
      - 'decision': A concise statement of your final strategy (e.g. "Instruct Kohli to anchor, rotation-strike against spin; bowling change: hold Bumrah for over 19, bowl Pathirana now.")
      - 'reasoning': A detailed breakdown of your strategy covering phase management, risk vs reward percentages, defensive vs offensive adjustments, and how you accounted for the stats analysis and win probability.
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
    console.error("Gemini API call failed in Strategist, falling back to local simulation:", error);
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const { statsAnalysis = {}, winProbability = {}, devilsAdvocateCritique = "" } = context;
  const isRefining = !!devilsAdvocateCritique;
  
  const strikerName = matchState.batsmen?.find(b => b.isStriker)?.name || "striker";
  const bowlerName = matchState.bowler?.name || "bowler";
  const isChasing = matchState.innings === 2;

  let decision = "";
  let reasoning = "";

  if (!isRefining) {
    // Initial Plan
    if (isChasing) {
      const winProb = winProbability.battingWinProb || 50;
      const targetStr = matchState.target ? `chasing ${matchState.target}` : "";
      
      decision = `Tactical Chase: ${strikerName} to anchor with low risk (Target CRR: 8.0). Target bowler ${bowlerName}'s length balls; increase aggression in over 18.`;
      reasoning = `Initial strategic review:
- Win Probability: Batting team has a ${winProb}% chance of winning.
- Analysis: ${statsAnalysis.decision || "Matchup analytics suggest cautious approach"}.
- Plan: Instruct batsmen to rotating strike, avoid throwing wickets. Bring down Required Run Rate from ${winProbability.requiredRunRate || "current"} to sustainable levels before going all-out at the death. Set fields to block easy singles if defending.`;
    } else {
      decision = `Defensive Grip: Switch bowling end. Bowl standard off-stump lines, pack the off-side field (7-2 split) to starve ${strikerName} of runs.`;
      reasoning = `Initial strategic review:
- Score context: ${matchState.runs}/${matchState.wickets} after ${matchState.overs} overs.
- Plan: Maintain bowling discipline. Restrict boundaries. Introduce a spin bowler to slow down play, taking advantage of the ${matchState.pitchCondition || "Balanced"} pitch characteristics.`;
    }
  } else {
    // Refinement Plan based on Devil's Advocate
    decision = `Refined Pivot: Hold ${bowlerName} back. Use secondary bowler for one over of spin to create angle variations, then unleash primary bowler.`;
    reasoning = `Strategic adaptation after reviewing Devil's Advocate critique ("${devilsAdvocateCritique.slice(0, 100)}..."):
- Adaptation: Acknowledged the risk of exposing our lead bowler too early. 
- Execution: By inserting one over of medium-pace/spin now, we squeeze the batsman's angles while preserving our premium resources for the final 12 deliveries of the match where boundaries are most lethal.
- Field adjustment: Move deep-midwicket finer to prevent easy flick shots.`;
  }

  return { decision, reasoning };
}
