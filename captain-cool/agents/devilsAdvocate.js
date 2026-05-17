import { GoogleGenAI } from '@google/genai';

/**
 * Devil's Advocate Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains strategistDecision, statsAnalysis, winProbability)
 * @returns {object} { challenge, counterDecision, severity, decision, reasoning }
 */
export default async function devilsAdvocate(matchState, context = {}) {
  const { strategistDecision = "", statsAnalysis = "", winProbability = null } = context;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstructions = `
      You are the assistant coach who always challenges the captain's first instinct. 
      Your job is to find flaws in the Strategist's proposed decision. Consider:
      - What if dew makes spin ineffective?
      - Is the bowler being brought on actually tired or out of rhythm?
      - Is the batter due for a big shot?
      - What does recent form say against this plan?
      
      Challenge hard. Propose a counter-decision if the original is wrong.
      
      Output JSON format: 
      {
        "challenge": "Find the critical flaws in the Strategist's proposed decision. Challenge extremely hard.",
        "counterDecision": "Your proposed alternative tactical choice to solve the challenge.",
        "severity": "low or medium or high"
      }
    `;

    const prompt = `
      **MATCH STATE:**
      - Score: ${matchState.runs || matchState.currentScore}/${matchState.wickets} in ${matchState.overs || matchState.over} overs
      - Pitch Conditions: ${JSON.stringify(matchState.pitchConditions || matchState.pitchCondition)}
      - Target: ${matchState.target || matchState.targetScore || "N/A"}

      **STRATEGIST'S PROPOSED DECISION (Your Input):**
      "${typeof strategistDecision === 'object' ? (strategistDecision.decision || JSON.stringify(strategistDecision)) : strategistDecision}"

      **STATS ANALYST'S FINDINGS:**
      "${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}"

      **WIN PROBABILITY METRICS:**
      "${winProbability ? JSON.stringify(winProbability) : "N/A"}"
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
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const { strategistDecision = "", statsAnalysis = {} } = context;
  const strikerName = matchState.batsmen?.find(b => b.isStriker)?.name || "Shivam Dube";
  const bowlerName = matchState.bowler?.name || "Jasprit Bumrah";

  const challenge = `Tactical Risk Warning: The proposed plan relies heavily on perfect bowler length execution and completely ignores ${strikerName}'s explosive trigger against raw pace under heavy dew conditions at Wankhede!`;
  const counterDecision = `Hold back your main bowler for one over or immediately swap to off-pace cutters, packing the deep backward square leg zone with protection.`;
  const severity = "high";

  return {
    challenge,
    counterDecision,
    severity,
    
    // Backward compatibility
    decision: challenge,
    reasoning: `Counter Decision Proposed: ${counterDecision}\nSeverity Threat: ${severity.toUpperCase()}`
  };
}

