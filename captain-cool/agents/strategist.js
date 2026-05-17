/**
 * Strategist Agent - "Captain Cool" Multi-Agent Strategy System
 * Acts as the master strategist (representing Captain Cool's brain). Takes inputs from the
 * Stats Analyst, Win Probability tool, and refines decisions based on the Devil's Advocate critique.
 */
import { GoogleGenAI } from '@google/genai';
import { calculateWinProbabilityTool, calculateWinProbability } from '../tools/winProbability.js';

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
      
      You have access to the 'calculateWinProbability' tool. You should invoke this tool first to obtain the precise win probability 
      of the batting team based on the match parameters (innings, over, score, wickets, target, and pitch factors) to back your strategies with scientific data.
    `;

    let prompt = `
      ${systemInstructions}

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

      Use 'calculateWinProbability' if necessary to analyze the risk-adjusted outcomes of your decision.
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
      Format your final response as a JSON object containing:
      - 'decision': A concise statement of your final strategy.
      - 'reasoning': A detailed breakdown of your strategy covering phase management, risk vs reward percentages, defensive vs offensive adjustments, and how you accounted for the stats analysis and win probability.
    `;

    // Turn 1: Query Gemini with the function tool registered
    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [calculateWinProbabilityTool] }]
      }
    });

    let resultText = "";

    // Check if Gemini returned a function call request
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "calculateWinProbability") {
        console.log(`🤖 [Captain Cool Brain] Gemini invoked Tool Call: ${call.name}`, call.args);
        
        // Execute the JS function locally
        const toolOutput = await calculateWinProbability(call.args);
        
        // Prepare turn 2 with tool response history
        const conversationHistory = [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ functionCall: call }] },
          { 
            role: 'tool', 
            parts: [{ 
              functionResponse: { 
                name: "calculateWinProbability", 
                response: { result: toolOutput } 
              } 
            }] 
          }
        ];

        // Turn 2: Request final structured strategy with resolved metrics
        const finalResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: conversationHistory,
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

        resultText = finalResponse.text.trim();
      }
    } else {
      // Model skipped tool execution and returned text directly
      resultText = response.text.trim();
      
      // Enforce JSON format if not returned as an object
      if (!resultText.startsWith("{")) {
        const structuralResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Format the following strategic decision and reasoning as clean JSON with 'decision' and 'reasoning' fields:\n\n${resultText}`,
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
        resultText = structuralResponse.text.trim();
      }
    }

    const result = JSON.parse(resultText);
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
