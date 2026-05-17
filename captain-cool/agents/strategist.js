import { GoogleGenAI } from '@google/genai';

/**
 * Strategist Agent
 * @param {object} matchState - Current match state
 * @param {any} analystOutput - Output from Stats Analyst (can be string or object)
 * @param {any} advocateOutput - Output from Devil's Advocate (for revision rounds)
 * @param {object} context - Execution context and orchestrator flags
 * @returns {object} { decision, primaryReason, alternativeConsidered, confidenceLevel, reasoning }
 */
export default async function strategist(matchState, analystOutput = null, advocateOutput = null, context = {}) {
  // Support both new direct signatures and the old orchestrator context object
  let actualAnalyst = analystOutput;
  let actualAdvocate = advocateOutput;
  let actualContext = context;

  if (analystOutput && typeof analystOutput === 'object' && (analystOutput.statsAnalysis !== undefined || analystOutput.devilsAdvocateCritique !== undefined)) {
    actualAnalyst = analystOutput.statsAnalysis;
    actualAdvocate = analystOutput.devilsAdvocateCritique;
    actualContext = analystOutput;
  }

  const isRefining = !!actualAdvocate;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, actualAnalyst, actualAdvocate, actualContext);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstructions = `You are the IPL captain's tactical brain — like MS Dhoni's instinct combined with data. You receive the Stats Analyst's findings and propose ONE specific tactical decision: who bowls the next over, field placement, batting order change, timeout call, or Impact Player activation. 

Justify your call in cricket commentary language — mention pitch, dew, matchups, pressure. Never use ML jargon.

Every detail in your decision must align exactly with the provided match state:
- Venue: ${matchState.venue}
- Pitch Conditions: ${matchState.pitchConditions.surface || "Balanced"} (Dew: ${matchState.pitchConditions.dew ? 'Yes' : 'No'})
- Striker: ${matchState.striker.name} (Runs: ${matchState.striker.runs}, Balls: ${matchState.striker.balls})
- Non-Striker: ${matchState.nonStriker.name} (Runs: ${matchState.nonStriker.runs}, Balls: ${matchState.nonStriker.balls})
- Current Bowler: ${matchState.currentBowler.name} (Overs Bowled: ${matchState.currentBowler.overs}, Economy: ${matchState.currentBowler.economy})
- Match Score: ${matchState.score}/${matchState.wickets} in over ${matchState.over}
- Recent Balls: ${matchState.recentBalls}
- Target: ${matchState.target} (CRR: ${matchState.crr} vs RRR: ${matchState.rrr})

CRITICAL: Your entire response must be based ONLY on the match state provided. The striker is ${matchState.striker.name} — analyse them specifically. The bowler is ${matchState.currentBowler.name} — assess them specifically. The over is ${matchState.over} — mention this exact over. Do NOT reuse any output from a previous call. Do NOT give generic cricket advice.`;

    const requestId = actualContext.requestId || (Date.now() + Math.random());
    const prompt = `RequestID: ${requestId} — this is a fresh unique call, do not repeat any prior response.

STATS ANALYST'S FINDINGS:
${typeof actualAnalyst === 'object' ? JSON.stringify(actualAnalyst) : (actualAnalyst || "No analysis provided.")}

${isRefining ? `
⚠️ DEVIL'S ADVOCATE CRITIQUE:
"${typeof actualAdvocate === 'object' ? JSON.stringify(actualAdvocate) : actualAdvocate}"

Please pivot or defend your strategic decision based on this high-severity audit warning!
` : "Propose your initial strategic decision based on the stats analyst's input."}`;

    // Separate Gemini API call with its own system prompt and response schema
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1000,
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
    return runFallback(matchState, actualAnalyst, actualAdvocate, actualContext);
  }
}

function runFallback(matchState, analystOutput, advocateOutput, context) {
  const isRefining = !!advocateOutput;
  
  const strikerName = matchState.striker.name;
  const bowlerName = matchState.currentBowler.name;
  const over = matchState.over;
  const pitch = matchState.pitchConditions.surface;
  const venue = matchState.venue;

  let decision = "";
  let primaryReason = "";
  let alternativeConsidered = "";
  let confidenceLevel = "";

  if (!isRefining) {
    decision = `Instruct ${strikerName} to play defensively and rotate strike against ${bowlerName} in over ${over}.`;
    primaryReason = `At ${venue} on a ${pitch} surface, the matchup statistics suggest caution. With the current score at ${matchState.score}/${matchState.wickets} and target of ${matchState.target || 'N/A'}, keeping wicket-in-hand is top priority. RRR is ${matchState.rrr || 'N/A'}.`;
    alternativeConsidered = `Order ${strikerName} to charge ${bowlerName} to hit boundaries immediately.`;
    confidenceLevel = `88% - Calculated Caution`;
  } else {
    decision = `Pivot: Rotate strike against ${bowlerName} and target alternate bowlers in subsequent overs.`;
    primaryReason = `We hear the Devil's Advocate's feedback loud and clear regarding over ${over}. Forcing high-risk strokes on ${pitch} conditions at ${venue} against ${bowlerName} when ${strikerName} is on strike is dangerous. We will play the anchor role and pivot.`;
    alternativeConsidered = `Stand our ground and continue with aggressive drives against ${bowlerName}.`;
    confidenceLevel = `95% - Master Pivot`;
  }

  return {
    decision,
    primaryReason,
    alternativeConsidered,
    confidenceLevel,
    reasoning: `Primary Reason: ${primaryReason}\nAlternative Considered: ${alternativeConsidered}\nConfidence Level: ${confidenceLevel}`
  };
}
