import { GoogleGenAI } from '@google/genai';

/**
 * Strategist Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains statsAnalysis, winProbability, devilsAdvocateCritique)
 * @returns {object} { decision, primaryReason, alternativeConsidered, confidenceLevel, reasoning }
 */
export default async function strategist(matchState, context = {}) {
  const { statsAnalysis = "", winProbability = null, devilsAdvocateCritique = "" } = context;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const isRefining = !!devilsAdvocateCritique;

    const systemInstructions = `
      You are the IPL captain's tactical brain — like MS Dhoni's instinct combined with data. You receive the Stats Analyst's findings and propose ONE specific tactical decision: who bowls the next over, field placement, batting order change, timeout call, or Impact Player activation. 

      Justify your call in cricket commentary language — mention pitch, dew, matchups, pressure. Never use ML jargon.
      
      Output JSON format: 
      {
        "decision": "Your specific tactical decision.",
        "primaryReason": "Commentary-style justification of your choice (pitch, dew, matchups, pressure). No ML jargon.",
        "alternativeConsidered": "The tactical alternative you weighed and discarded.",
        "confidenceLevel": "Your confidence level (e.g. '92% - Locked In')"
      }
    `;

    const prompt = `
      **MATCH STATE:**
      - Batting Team: ${matchState.battingTeam}
      - Bowling Team: ${matchState.bowlingTeam}
      - Current Innings: ${matchState.innings}
      - Over: ${matchState.overs || matchState.over}, Ball: ${matchState.ball || 0}
      - Score: ${matchState.runs || matchState.currentScore}/${matchState.wickets}
      - Target (if 2nd innings): ${matchState.target || matchState.targetScore || "N/A"}
      - Pitch Conditions: ${JSON.stringify(matchState.pitchConditions || matchState.pitchCondition)}
      - Recent Ball History: [${(matchState.recentDeliveries || []).join(', ')}]

      **STATS ANALYST'S FINDINGS (Your Context):**
      ${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}

      ${isRefining ? `
      ⚠️ **DEVIL'S ADVOCATE CRITIQUE OF YOUR INITIAL PLAN:**
      "${devilsAdvocateCritique}"
      
      Please refine your strategic decision. You must either adapt/pivot based on this severe risk warning or provide a brilliant captain's justification standing your ground.
      ` : ""}
    `;

    // Separate Gemini API call with its own system prompt and response schema
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            decision: { type: 'STRING' },
            primaryReason: { type: 'STRING' },
            alternativeConsidered: { type: 'STRING' },
            confidenceLevel: { type: 'STRING' }
          },
          required: ['decision', 'primaryReason', 'alternativeConsidered', 'confidenceLevel']
        }
      }
    });

    const resultText = response.text.trim();
    const result = JSON.parse(resultText);

    return {
      decision: result.decision,
      primaryReason: result.primaryReason,
      alternativeConsidered: result.alternativeConsidered,
      confidenceLevel: result.confidenceLevel,
      
      // Backward compatibility for orchestrator and critique loops
      reasoning: `Primary Reason: ${result.primaryReason}\nAlternative Considered: ${result.alternativeConsidered}\nConfidence Level: ${result.confidenceLevel}`
    };
  } catch (error) {
    console.error("Gemini API call failed in Strategist, falling back to local simulation:", error);
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const { statsAnalysis = {}, winProbability = {}, devilsAdvocateCritique = "" } = context;
  const isRefining = !!devilsAdvocateCritique;
  
  const strikerName = matchState.batsmen?.find(b => b.isStriker)?.name || "Shivam Dube";
  const bowlerName = matchState.bowler?.name || "Jasprit Bumrah";
  const isChasing = matchState.innings === 2;

  let decision = "";
  let primaryReason = "";
  let alternativeConsidered = "";
  let confidenceLevel = "";

  if (!isRefining) {
    if (isChasing) {
      decision = `Keep Shivam Dube on strike, but advise strike rotation over boundaries for this over.`;
      primaryReason = `Look, with heavy dew on the turf and Bumrah firing sub-145k yorkers, the ball is skidding dangerously. Dube has a historical average of 16.5 against Jasprit. Bringing him into high-risk shots is a recipe for disaster under this immense scoreboard pressure! Rotation is our best ally here.`;
      alternativeConsidered = `Order Dube to target Bumrah's back-of-length deliveries behind deep mid-wicket.`;
      confidenceLevel = `85% - Dhoni's Chill Instinct`;
    } else {
      decision = `Switch Jasprit Bumrah to the Wankhede Media End to exploit the reverse swing.`;
      primaryReason = `The dry Wankhede surface and afternoon heat are scuffing the leather. By switching ends, Bumrah gets the optimal angle to target the batsman's toes, neutralizing their stance with scoreboard pressure building.`;
      alternativeConsidered = `Hold Bumrah back and introduce slow off-spin from the pavilion end.`;
      confidenceLevel = `90% - Tactically Locked`;
    }
  } else {
    decision = `Pivot: Hold Shivam Dube back from aggressive drives and swap strikers immediately.`;
    primaryReason = `Acknowledge the Devil's Advocate's crucial warning: forcing Dube into aggressive paced shots against Bumrah on a slick surface is an early funeral. We will rotate singles, let him survive Bumrah's over, and save our ammunition for the 17th over.`;
    alternativeConsidered = `Stand ground and rely on Dube's raw power to clear the short boundary despite the slick turf.`;
    confidenceLevel = `95% - Master Pivot`;
  }

  return {
    decision,
    primaryReason,
    alternativeConsidered,
    confidenceLevel,
    
    // Backward compatibility
    reasoning: `Primary Reason: ${primaryReason}\nAlternative Considered: ${alternativeConsidered}\nConfidence Level: ${confidenceLevel}`
  };
}
