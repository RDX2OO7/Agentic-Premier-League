/**
 * Multi-Agent Orchestrator - "Undercover Captain" Multi-Agent Strategy System
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
 * Main Undercover Captain Multi-Agent Orchestrator Loop
 * @param {object} rawMatchState - Input match state parameters
 * @returns {object} Full step-by-step orchestrator report and debate transcript
 */
export async function runCaptainCool(rawMatchState) {
  console.log("\n[Orchestrator] Starting Undercover Captain Multi-Agent Strategy Engine...");

  // Validate and sanitize the match state
  const matchState = validateMatchState(rawMatchState);
  console.log(`[Orchestrator] Match State validated for ${matchState.battingTeam} vs ${matchState.bowlingTeam}`);

  // Generate unique requestId for Cache Buster (STEP 8)
  const requestId = Date.now() + Math.random();
  const context = { requestId };

  // Compute Win Probability Tool
  console.log("[Orchestrator] Running Win Probability Tool...");
  const winProbability = await calculateWinProbability(matchState);
  console.log(`[Orchestrator] Computed Win Probabilities - Batting: ${winProbability.battingWinProb}%, Bowling: ${winProbability.bowlingWinProb}%`);

  const transcript = [];

  // Step 1: Run Stats Analyst Agent (matchState)
  console.log("\n==================================================");
  console.log("🤖 STATS ANALYST RAW OUTPUT");
  console.log("==================================================");
  const analystOutput = await statsAnalyst(matchState, context);
  const statsOutput = typeof analystOutput === 'object' ? JSON.stringify(analystOutput, null, 2) : analystOutput;
  console.log(statsOutput);
  transcript.push({
    agent: "Stats Analyst",
    output: statsOutput,
    timestamp: new Date().toISOString()
  });

  // Step 2: Run Strategist Agent with analystOutput context
  console.log("\n==================================================");
  console.log("🧠 STRATEGIST (INITIAL DRAFT) RAW OUTPUT");
  console.log("==================================================");
  const strategistOutput = await strategist(matchState, analystOutput, null, context);
  const stratInitOutput = typeof strategistOutput === 'object' ? JSON.stringify(strategistOutput, null, 2) : strategistOutput;
  console.log(stratInitOutput);
  transcript.push({
    agent: "Strategist (Initial)",
    output: stratInitOutput,
    timestamp: new Date().toISOString()
  });

  // Step 3: Run Devil's Advocate Agent with strategistOutput context (STEP 5)
  console.log("\n==================================================");
  console.log("👹 DEVIL'S ADVOCATE RAW OUTPUT");
  console.log("==================================================");
  const advocateOutput = await devilsAdvocate(matchState, strategistOutput, context);
  const devilsOutput = typeof advocateOutput === 'object' ? JSON.stringify(advocateOutput, null, 2) : advocateOutput;
  console.log(devilsOutput);
  transcript.push({
    agent: "Devil's Advocate",
    output: devilsOutput,
    timestamp: new Date().toISOString()
  });

  // Step 4: If advocateOutput severity === "high", run strategistAgent again with (matchState, analystOutput, advocateOutput)
  let refinedStrategy = strategistOutput;
  const severity = advocateOutput.severity || "";
  const isHighSeverity = severity.toLowerCase() === "high";

  if (isHighSeverity) {
    console.log("\n==================================================");
    console.log("🧠 STRATEGIST (REFINED DEBATE TURN) RAW OUTPUT");
    console.log("==================================================");
    refinedStrategy = await strategist(matchState, analystOutput, advocateOutput, context);
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

  // Format full debate history string for commentator
  const fullDebateHistory = `
=== STATS ANALYST FINDINGS ===
${JSON.stringify(analystOutput)}

=== INITIAL STRATEGY PROPOSED ===
${JSON.stringify(strategistOutput)}

=== DEVIL'S ADVOCATE AUDIT AND CRITIQUE ===
${JSON.stringify(advocateOutput)}

=== FINAL REFINED STRATEGY ===
${JSON.stringify(refinedStrategy)}
`;

  // Step 5: Run commentatorAgent(matchState, fullDebateHistory)
  console.log("\n==================================================");
  console.log("🎙️ MATCH COMMENTATOR RAW OUTPUT");
  console.log("==================================================");
  const commentary = await commentator(matchState, fullDebateHistory, context);
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
    transcript,
    agents: {
      statsAnalyst: analystOutput,
      strategistInitial: strategistOutput,
      devilsAdvocate: advocateOutput,
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
