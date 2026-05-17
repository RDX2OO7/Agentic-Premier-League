/**
 * Multi-Agent Orchestrator - "Captain Cool" Multi-Agent Strategy System
 * Conducts the workflow, manages dependencies, runs tools, and coordinates 
 * the multi-agent debate (StatsAnalyst -> Strategist -> DevilsAdvocate -> Strategist-Refined -> Commentator).
 */

import { validateMatchState } from './matchState.js';
import { calculateWinProbability } from './tools/winProbability.js';
import statsAnalyst from './agents/statsAnalyst.js';
import strategist from './agents/strategist.js';
import devilsAdvocate from './agents/devilsAdvocate.js';
import commentator from './agents/commentator.js';

/**
 * Main Captain Cool Multi-Agent Orchestrator Loop
 * @param {object} rawMatchState - Input match state parameters
 * @returns {object} Full step-by-step orchestrator report and debate transcript
 */
export async function runCaptainCool(rawMatchState) {
  console.log("\n[Orchestrator] Starting Undercover Captain Multi-Agent Strategy Engine...");

  // Validate and sanitize the match state
  const matchState = validateMatchState(rawMatchState);
  console.log(`[Orchestrator] Match State validated for ${matchState.battingTeam} vs ${matchState.bowlingTeam}`);

  // Compute Win Probability Tool
  console.log("[Orchestrator] Running Win Probability Tool...");
  const winProbability = await calculateWinProbability(matchState);
  console.log(`[Orchestrator] Computed Win Probabilities - Batting: ${winProbability.battingWinProb}%, Bowling: ${winProbability.bowlingWinProb}%`);

  const transcript = [];

  // Step 1: Run Stats Analyst Agent
  console.log("\n==================================================");
  console.log("🤖 STATS ANALYST RAW OUTPUT");
  console.log("==================================================");
  const statsAnalysis = await statsAnalyst(matchState);
  const statsOutput = typeof statsAnalysis === 'object' ? JSON.stringify(statsAnalysis, null, 2) : statsAnalysis;
  console.log(statsOutput);
  transcript.push({
    agent: "Stats Analyst",
    output: statsOutput,
    timestamp: new Date().toISOString()
  });

  // Step 2: Run Strategist with analyst output → get proposed decision
  console.log("\n==================================================");
  console.log("🧠 STRATEGIST (INITIAL DRAFT) RAW OUTPUT");
  console.log("==================================================");
  const initialStrategy = await strategist(matchState, {
    statsAnalysis,
    winProbability
  });
  const stratInitOutput = typeof initialStrategy === 'object' ? JSON.stringify(initialStrategy, null, 2) : initialStrategy;
  console.log(stratInitOutput);
  transcript.push({
    agent: "Strategist (Initial)",
    output: stratInitOutput,
    timestamp: new Date().toISOString()
  });

  // Step 3: Run Devil's Advocate with strategist output → get challenge
  console.log("\n==================================================");
  console.log("👹 DEVIL'S ADVOCATE RAW OUTPUT");
  console.log("==================================================");
  const devilsAdvocateCritique = await devilsAdvocate(matchState, {
    strategistDecision: initialStrategy,
    statsAnalysis,
    winProbability
  });
  const devilsOutput = typeof devilsAdvocateCritique === 'object' ? JSON.stringify(devilsAdvocateCritique, null, 2) : devilsAdvocateCritique;
  console.log(devilsOutput);
  transcript.push({
    agent: "Devil's Advocate",
    output: devilsOutput,
    timestamp: new Date().toISOString()
  });

  // Step 4: IF severity === "high": run Strategist again with the challenge (revision round) ELSE keep original decision
  let refinedStrategy = initialStrategy;
  const severity = devilsAdvocateCritique.severity || "";
  const isHighSeverity = severity.toLowerCase() === "high";

  if (isHighSeverity) {
    console.log("\n==================================================");
    console.log("🧠 STRATEGIST (REFINED DEBATE TURN) RAW OUTPUT");
    console.log("==================================================");
    refinedStrategy = await strategist(matchState, {
      statsAnalysis,
      winProbability,
      devilsAdvocateCritique: devilsAdvocateCritique.decision + "\n" + devilsAdvocateCritique.reasoning
    });
    const stratRefOutput = typeof refinedStrategy === 'object' ? JSON.stringify(refinedStrategy, null, 2) : refinedStrategy;
    console.log(stratRefOutput);
    transcript.push({
      agent: "Strategist (Refined)",
      output: stratRefOutput,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log(`\n[Orchestrator] Devil's Advocate severity is "${severity}". Skipping Strategist revision round.`);
  }

  // Step 5: Run Commentator with full debate transcript → get final output
  console.log("\n==================================================");
  console.log("🎙️ MATCH COMMENTATOR RAW OUTPUT");
  console.log("==================================================");
  const commentary = await commentator(matchState, {
    refinedStrategy,
    initialStrategy,
    devilsAdvocateCritique,
    statsAnalysis,
    winProbability
  });
  const commOutput = typeof commentary === 'object' ? (commentary.text || commentary.reasoning || JSON.stringify(commentary, null, 2)) : commentary;
  console.log(commOutput);
  transcript.push({
    agent: "Commentator",
    output: commOutput,
    timestamp: new Date().toISOString()
  });

  // Return the complete multi-agent response package
  return {
    timestamp: new Date().toISOString(),
    matchState,
    winProbability,
    transcript, // Store the full debate transcript as requested
    agents: {
      statsAnalyst: statsAnalysis,
      strategistInitial: initialStrategy,
      devilsAdvocate: devilsAdvocateCritique,
      strategistRefined: refinedStrategy,
      commentator: commentary
    }
  };
}

/**
 * Backward compatible export wrapper for Express API integration
 */
export async function runStrategySystem(rawMatchState) {
  return runCaptainCool(rawMatchState);
}

