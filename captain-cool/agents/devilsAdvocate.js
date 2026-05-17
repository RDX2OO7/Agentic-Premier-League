import { GoogleGenAI } from '@google/genai';

/**
 * Devil's Advocate Agent
 * @param {object} matchState - Current match state
 * @param {any} strategistOutput - Output from the Strategist (can be string or object)
 * @param {object} context - Execution context and orchestrator flags
 * @returns {object} { challenge, counterDecision, severity, decision, reasoning }
 */
export default async function devilsAdvocate(matchState, strategistOutput = null, context = {}) {
  // Support both new direct signatures and the old orchestrator context object
  let actualStrategist = strategistOutput;
  let actualContext = context;

  if (strategistOutput && typeof strategistOutput === 'object' && (strategistOutput.strategistDecision !== undefined || strategistOutput.decision !== undefined)) {
    actualStrategist = strategistOutput.strategistDecision || strategistOutput;
    actualContext = strategistOutput;
  }

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, actualStrategist, actualContext);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstructions = `You are the assistant coach who always challenges the captain's first instinct. Your job is to find flaws in the Strategist's proposed decision.

Consider:
- What if dew makes spin ineffective?
- Is the bowler being brought on actually tired or out of rhythm?
- Is the batter due for a big shot?
- What does recent form say against this plan?

Challenge hard. Propose a counter-decision if the original is wrong.

Every detail in your audit must align exactly with the provided match state:
- Venue: ${matchState.venue}
- Pitch Conditions: ${matchState.pitchConditions.surface || "Balanced"} (Dew: ${matchState.pitchConditions.dew ? 'Yes' : 'No'})
- Striker: ${matchState.striker.name} (Runs: ${matchState.striker.runs}, Balls: ${matchState.striker.balls})
- Non-Striker: ${matchState.nonStriker.name} (Runs: ${matchState.nonStriker.runs}, Balls: ${matchState.nonStriker.balls})
- Current Bowler: ${matchState.currentBowler.name} (Overs Bowled: ${matchState.currentBowler.overs}, Economy: ${matchState.currentBowler.economy})
- Match Score: ${matchState.score}/${matchState.wickets} in over ${matchState.over}
- Recent Balls: ${matchState.recentBalls}
- Target: ${matchState.target} (CRR: ${matchState.crr} vs RRR: ${matchState.rrr})

CRITICAL: Your entire response must be based ONLY on the match state provided. The striker is ${matchState.striker.name} — analyse them specifically. The bowler is ${matchState.currentBowler.name} — assess them specifically. The over is ${matchState.over} — mention this exact over. Do NOT reuse any output from a previous call. Do NOT give generic cricket advice.`;

    const proposedDecision = typeof actualStrategist === 'object' ? (actualStrategist.decision || "") : actualStrategist;
    const proposedReason = typeof actualStrategist === 'object' ? (actualStrategist.primaryReason || "") : "";

    const requestId = actualContext.requestId || (Date.now() + Math.random());
    const prompt = `RequestID: ${requestId} — this is a fresh unique call, do not repeat any prior response.

The Strategist just proposed: ${proposedDecision}. Their reason: ${proposedReason}. You must challenge THIS specific decision. Ask whether ${matchState.currentBowler.name} is the right choice at over ${matchState.over} given ${matchState.pitchConditions.surface} conditions and ${matchState.striker.name} on strike with ${matchState.striker.runs} runs.`;

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
            challenge: { type: 'STRING' },
            counterDecision: { type: 'STRING' },
            severity: { 
              type: 'STRING',
              enum: ['low', 'medium', 'high']
            }
          },
          required: ['challenge', 'counterDecision', 'severity']
        }
      }
    });

    const resultText = response.text.trim();
    const result = JSON.parse(resultText);

    return {
      challenge: result.challenge,
      counterDecision: result.counterDecision,
      severity: result.severity,
      
      // Backward compatibility for orchestrator and debate loops
      decision: result.challenge,
      reasoning: `Counter Decision Proposed: ${result.counterDecision}\nSeverity Threat: ${result.severity.toUpperCase()}`
    };
  } catch (error) {
    console.error("Gemini API call failed in Devil's Advocate, falling back to local simulation:", error);
    return runFallback(matchState, actualStrategist, actualContext);
  }
}

function runFallback(matchState, strategistOutput, context) {
  const strikerName = matchState.striker.name;
  const bowlerName = matchState.currentBowler.name;
  const over = matchState.over;
  const pitch = matchState.pitchConditions.surface;
  const venue = matchState.venue;

  // Make the high-severity threat trigger dynamic depending on pitch conditions
  const severity = pitch.toLowerCase().includes("turning") || pitch.toLowerCase().includes("dusty") || pitch.toLowerCase().includes("slow") ? "high" : "medium";

  const challenge = `Tactical Risk Warning: The proposed plan relies heavily on defensive strokeplay against ${bowlerName} in over ${over} at ${venue}, but fails to account for the skidding nature on these ${pitch} conditions which could easily lead to an LBW or catch for ${strikerName}!`;
  const counterDecision = `Order ${strikerName} to play with soft hands to rotate strike immediately, or introduce an off-side heavy field sweep to counter ${bowlerName}.`;

  return {
    challenge,
    counterDecision,
    severity,
    
    // Backward compatibility
    decision: challenge,
    reasoning: `Counter Decision Proposed: ${counterDecision}\nSeverity Threat: ${severity.toUpperCase()}`
  };
}
