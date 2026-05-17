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
 * Executes the full Captain Cool multi-agent simulation for a given match state
 * @param {object} rawMatchState - Input match state parameters
 * @returns {object} Full step-by-step orchestrator report
 */
export async function runStrategySystem(rawMatchState) {
  console.log("\n[Orchestrator] Starting Captain Cool Multi-Agent Strategy Engine...");

  // Step 1: Validate and sanitize the match state
  const matchState = validateMatchState(rawMatchState);
  console.log(`[Orchestrator] Match State validated for ${matchState.battingTeam} vs ${matchState.bowlingTeam}`);

  // Step 2: Compute Win Probability Tool
  console.log("[Orchestrator] Running Win Probability Tool...");
  const winProbability = await calculateWinProbability(matchState);
  console.log(`[Orchestrator] Computed Win Probabilities - Batting: ${winProbability.battingWinProb}%, Bowling: ${winProbability.bowlingWinProb}%`);

  // Step 3: Run Stats Analyst Agent
  console.log("[Orchestrator] Invoking Stats Analyst Agent...");
  const statsAnalysis = await statsAnalyst(matchState);
  console.log("[Orchestrator] Stats Analyst generated insights:", statsAnalysis.decision);

  // Step 4: Run Strategist Agent (Initial Tactic)
  console.log("[Orchestrator] Invoking Strategist Agent (Initial Round)...");
  const initialStrategy = await strategist(matchState, {
    statsAnalysis,
    winProbability
  });
  console.log("[Orchestrator] Initial Strategy formulated:", initialStrategy.decision);

  // Step 5: Run Devil's Advocate Agent (Skeptical Critique)
  console.log("[Orchestrator] Invoking Devil's Advocate Agent (Critique)...");
  const devilsAdvocateCritique = await devilsAdvocate(matchState, {
    strategistDecision: initialStrategy,
    statsAnalysis,
    winProbability
  });
  console.log("[Orchestrator] Devil's Advocate critique generated:", devilsAdvocateCritique.decision);

  // Step 6: Run Strategist Agent again for Refinement (The Multi-Agent Debate Loop!)
  console.log("[Orchestrator] Re-invoking Strategist Agent for Refined Master Plan...");
  const refinedStrategy = await strategist(matchState, {
    statsAnalysis,
    winProbability,
    devilsAdvocateCritique: devilsAdvocateCritique.decision + "\n" + devilsAdvocateCritique.reasoning
  });
  console.log("[Orchestrator] Refined Master Tactic locked in:", refinedStrategy.decision);

  // Step 7: Run Commentator Agent (Broadcast Presentation)
  console.log("[Orchestrator] Invoking Commentator Agent for live broadcast delivery...");
  const commentary = await commentator(matchState, {
    refinedStrategy,
    initialStrategy,
    devilsAdvocateCritique,
    statsAnalysis,
    winProbability
  });
  console.log("[Orchestrator] Commentator broadcast script ready!");

  // Return the complete multi-agent response package
  return {
    timestamp: new Date().toISOString(),
    matchState,
    winProbability,
    agents: {
      statsAnalyst: statsAnalysis,
      strategistInitial: initialStrategy,
      devilsAdvocate: devilsAdvocateCritique,
      strategistRefined: refinedStrategy,
      commentator: commentary
    }
  };
}
