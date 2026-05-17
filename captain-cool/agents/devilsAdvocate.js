/**
 * Devil's Advocate Agent - "Captain Cool" Multi-Agent Strategy System
 * Critiques the Strategist's proposed plan, pointing out high-risk assumptions, blind spots,
 * and potential counter-strategies that the opponent might execute.
 */
import { GoogleGenAI } from '@google/genai';

/**
 * Devil's Advocate Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains strategistDecision, statsAnalysis, winProbability)
 * @returns {object} { decision, reasoning }
 */
export default async function devilsAdvocate(matchState, context = {}) {
  const { strategistDecision = "", statsAnalysis = "", winProbability = null } = context;

  // Check for Gemini API Key. If missing, use local fallback.
  if (!process.env.GEMINI_API_KEY) {
    return runFallback(matchState, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are the Devil's Advocate agent in the "Captain Cool" IPL strategy system.
      Your primary function is to serve as the critical auditor of the Strategist's proposed plan.
      You must look for hidden assumptions, tactical flaws, opponent counter-strategies, and high-risk elements.
      You should be sharp, analytical, skeptical, and highly focused on downside risks.

      **Current Match State:**
      - Score: ${matchState.runs}/${matchState.wickets} in ${matchState.overs} overs
      - Pitch Condition: ${matchState.pitchCondition}
      - Target: ${matchState.target || "N/A"}

      **Proposed Strategy from the Strategist:**
      "${typeof strategistDecision === 'object' ? JSON.stringify(strategistDecision) : strategistDecision}"

      **Stats Analyst Insights:**
      "${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}"

      **Win Probability Metrics:**
      "${winProbability ? JSON.stringify(winProbability) : "N/A"}"

      **Your Skeptical Assignment:**
      Examine the proposed strategy closely. Provide a devastatingly critical, highly realistic critique of why this plan might fail:
      1. What are the key assumptions the strategist is making (e.g. assuming the bowler will execute yorkers flawlessly, or that the batsman won't attack)?
      2. What is the counter-move the opposing team will make to immediately neutralize this plan (e.g., substituting a left-handed batsman, changing batting pacing, targeting the bowler's slower ball)?
      3. What are the extreme tail risks (e.g., over-bowling a premium bowler too early, leaving a rookie bowler to defend 8 runs in the final over, or ignoring dew impact)?

      Format your response as a JSON object containing:
      - 'decision': A highly concentrated summary of the primary threat/flaw in the strategist's plan (e.g., "High Risk: Using Bumrah now leaves 15 runs to defend in the last over by a rookie spinner vs Dhoni.")
      - 'reasoning': A structured list of distinct vulnerabilities, risk analyses, and opposing team counters.
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
    console.error("Gemini API call failed in Devil's Advocate, falling back to local simulation:", error);
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const { strategistDecision = "", statsAnalysis = {} } = context;
  const bowlerName = matchState.bowler?.name || "bowler";
  const strikerName = matchState.batsmen?.find(b => b.isStriker)?.name || "striker";

  let decision = "";
  let reasoning = "";

  decision = `Tactical Risk Warning: The proposed strategy assumes high bowler execution accuracy and ignores ${strikerName}'s aggressive trigger vs pace.`;
  reasoning = `Skeptical review of: "${typeof strategistDecision === 'object' ? strategistDecision.decision : strategistDecision}"
- Vulnerability 1: Over-reliance on ${bowlerName} maintaining a perfect line. If they miss their length by a fraction, the batsman's high boundary strike-rate will punish us.
- Vulnerability 2: If we commit to a defensive field split, a smart batsman will shift their stance to exploit vacant areas in the fine-leg or third-man regions.
- Opponent Counter: The batting team could introduce a pinch-hitter left-hander to neutralize our off-spinner's angle, turning our strategy upside down.
- Recommendation: Hold back one over of our main bowler or add protection in the deep backward square leg zone.`;

  return { decision, reasoning };
}
