import { GoogleGenAI } from '@google/genai';

/**
 * Commentator Agent
 * @param {object} matchState - Current match state
 * @param {any} fullDebateHistory - Full debate history formatted as text or the old context object
 * @param {object} context - Execution context and orchestrator flags
 * @returns {object} { decision, reasoning, text }
 */
export default async function commentator(matchState, fullDebateHistory = null, context = {}) {
  // Support both new direct signatures and the old orchestrator context object
  let actualHistory = fullDebateHistory;
  let actualContext = context;

  if (fullDebateHistory && typeof fullDebateHistory === 'object' && (fullDebateHistory.refinedStrategy !== undefined || fullDebateHistory.initialStrategy !== undefined)) {
    actualHistory = `
Stats Analyst Findings: ${JSON.stringify(fullDebateHistory.statsAnalysis || "")}
Strategist Initial: ${JSON.stringify(fullDebateHistory.initialStrategy || "")}
Devil's Advocate Challenge: ${JSON.stringify(fullDebateHistory.devilsAdvocateCritique || "")}
Strategist Refined/Final: ${JSON.stringify(fullDebateHistory.refinedStrategy || "")}
`;
    actualContext = fullDebateHistory;
  }

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, actualContext);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstructions = `You are Harsha Bhogle meets Nasser Hussain — you turn tactical cricket decisions into vivid, exciting commentary that any fan can understand. You receive the full agent debate and the final decision.

Write your response with these exact sections:
1. FINAL DECISION — one crisp sentence
2. CAPTAIN'S CALL — 3-4 lines of rich cricket commentary explaining why
3. THE DEBATE — summarize what the Devil's Advocate said and how the Strategist responded
4. WHY NOT THE OTHER OPTION — one line explaining the rejected alternative

Write like you're on air. No jargon. Output plain text, not JSON.

Every detail in your commentary must align exactly with the provided match state:
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

Here is the tactical debate transcript:
${typeof actualHistory === 'object' ? JSON.stringify(actualHistory) : (actualHistory || "No debate history provided.")}`;

    // Separate Gemini API call with its own system prompt and config
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1000
      }
    });

    const text = response.text.trim();

    // Parse final decision line for front-end header compatibility
    let decision = "ON-AIR: Broadcast wrap of the high-tension over!";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      if (line.toUpperCase().includes("FINAL DECISION")) {
        decision = line;
        break;
      }
    }

    return {
      decision: decision,
      reasoning: text,
      text: text
    };
  } catch (error) {
    console.error("Gemini API call failed in Commentator, falling back to local simulation:", error);
    return runFallback(matchState, actualContext);
  }
}

function runFallback(matchState, context) {
  const strikerName = matchState.striker.name;
  const bowlerName = matchState.currentBowler.name;
  const venue = matchState.venue;
  const over = matchState.over;
  const pitch = matchState.pitchConditions.surface;

  const decisionLine = `FINAL DECISION — Instruct ${strikerName} to play defensively and rotate strike against ${bowlerName} in over ${over}.`;
  
  const text = `${decisionLine}

CAPTAIN'S CALL — Look at the atmosphere at ${venue}, the tension is absolutely palpable! With ${strikerName} facing ${bowlerName} in over ${over} under ${pitch} conditions, we can't afford to take reckless chances. Running hard, rotating strike, and respecting ${bowlerName}'s line is the golden rule here!

THE DEBATE — The Devil's Advocate pointed out the severe risk warning regarding over ${over}. The Strategist initially wanted to build momentum, but our dynamic review triggered a calculated anchor pivot to preserve wickets.

WHY NOT THE OTHER OPTION — Charging ${bowlerName} was discarded because risking ${strikerName}'s wicket right now under CRR ${matchState.crr} vs RRR ${matchState.rrr} would deal a severe blow to the match chase!`;

  return {
    decision: decisionLine,
    reasoning: text,
    text: text
  };
}
