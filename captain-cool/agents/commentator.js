import { GoogleGenAI } from '@google/genai';

/**
 * Commentator Agent
 * @param {object} matchState - Current match state
 * @param {object} context - Orchestrator context (contains refinedStrategy, initialStrategy, devilsAdvocateCritique, statsAnalysis, winProbability)
 * @returns {object} { decision, reasoning, text }
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

    const systemInstructions = `
      You are Harsha Bhogle meets Nasser Hussain — you turn tactical cricket 
      decisions into vivid, exciting commentary that any fan can understand. 
      You receive the full agent debate and the final decision. Write:
      1. FINAL DECISION — one crisp sentence
      2. CAPTAIN'S CALL — 3-4 lines of rich cricket commentary explaining why
      3. THE DEBATE — summarize what the Devil's Advocate said and how the 
         Strategist responded
      4. WHY NOT THE OTHER OPTION — one line explaining the rejected alternative

      Write like you're on air. No jargon. Output plain text, not JSON.
    `;

    const prompt = `
      **MATCH STATE:**
      - Batting Team: ${matchState.battingTeam} (Striker: ${matchState.batsmen?.[0]?.name || "Shivam Dube"})
      - Bowling Team: ${matchState.bowlingTeam} (Bowler: ${matchState.bowler?.name || "Jasprit Bumrah"})
      - Score: ${matchState.runs || matchState.currentScore}/${matchState.wickets} in ${matchState.overs || matchState.over} overs
      - Target: ${matchState.target || matchState.targetScore || "N/A"}
      - Win Probability: Batting ${winProbability?.battingWinProb}% vs Bowling ${winProbability?.bowlingWinProb}%
      - Recent Play: [${(matchState.recentDeliveries || []).join(', ')}]

      **TACTICAL DEBATE ROOM:**
      - Stats Analyst Findings: ${typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis) : statsAnalysis}
      - Strategist's Initial Proposal: ${typeof initialStrategy === 'object' ? (initialStrategy.decision || JSON.stringify(initialStrategy)) : initialStrategy}
      - Devil's Advocate's Skeptical Challenge: ${typeof devilsAdvocateCritique === 'object' ? (devilsAdvocateCritique.challenge || JSON.stringify(devilsAdvocateCritique)) : devilsAdvocateCritique}
      - Captain Cool's Refined Final Tactic: ${typeof refinedStrategy === 'object' ? (refinedStrategy.decision || JSON.stringify(refinedStrategy)) : refinedStrategy}
    `;

    // Separate Gemini API call - plain text model generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions
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
    return runFallback(matchState, context);
  }
}

function runFallback(matchState, context) {
  const {
    refinedStrategy = {},
    devilsAdvocateCritique = {},
    winProbability = {}
  } = context;

  const strikerName = matchState.batsmen?.[0]?.name || "Shivam Dube";
  const bowlerName = matchState.bowler?.name || "Jasprit Bumrah";

  const text = `FINAL DECISION — Acknowledge the high-tension environment and pivot: Shivam Dube is instructed to rotate strike and let the non-striker take the boundary risk against Jasprit Bumrah's lethal spell.

CAPTAIN'S CALL — Look at the dew on the Wankhede grass, it's absolutely slick! Bumrah is firing thunderbolts, bowling with ice in his veins. Forcing Dube to force pace here under pressure is suicidal; we play smart, run hard, and hold our shape.

THE DEBATE — The Devil's Advocate warned that Bumrah's skidding deliveries on slick turf would trap Dube in front, whereas the Strategist initially wanted to charge. Captain Cool calmly pivoted, choosing caution for these six deliveries.

WHY NOT THE OTHER OPTION — Targeting Bumrah was rejected because the risk-adjusted win probability drops by 18% if we lose Dube's wicket now.`;

  return {
    decision: "FINAL DECISION — Rotate strike against Bumrah's over.",
    reasoning: text,
    text: text
  };
}

