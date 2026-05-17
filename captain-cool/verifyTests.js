import 'dotenv/config';
import { runCaptainCool } from './orchestrator.js';

// Setup Mock Scenarios for Test 1 and Test 2
const testScenario1 = {
  innings: 2,
  over: 6,
  score: 45,
  wickets: 2,
  target: 160,
  battingTeam: "Sunrisers Hyderabad",
  bowlingTeam: "Mumbai Indians",
  striker: {
    name: "Abhishek Sharma",
    runs: 22,
    balls: 15,
    recentForm: [12, 34, 54, 8, 20]
  },
  nonStriker: {
    name: "Travis Head",
    runs: 20,
    balls: 14
  },
  currentBowler: {
    name: "Jasprit Bumrah",
    economy: 5.8,
    overs: 1.0,
    recentForm: [2, 0, 1, 3, 1]
  },
  pitchConditions: {
    surface: "Flat and Hard",
    dew: false
  },
  venue: "Rajiv Gandhi International Stadium, Hyderabad",
  recentBalls: "1, 4, wd, 0, 6, 1, lbw",
  crr: 7.5,
  rrr: 8.21,
  impactPlayerAvailable: true
};

const testScenario2 = {
  innings: 2,
  over: 17,
  score: 148,
  wickets: 4,
  target: 185,
  battingTeam: "Chennai Super Kings",
  bowlingTeam: "Gujarat Titans",
  striker: {
    name: "MS Dhoni",
    runs: 15,
    balls: 9,
    recentForm: [8, 12, 32, 28, 4]
  },
  nonStriker: {
    name: "Ravindra Jadeja",
    runs: 28,
    balls: 22
  },
  currentBowler: {
    name: "Rashid Khan",
    economy: 6.9,
    overs: 3.0,
    recentForm: [1, 1, 2, 0, 2]
  },
  pitchConditions: {
    surface: "Dry and Turning",
    dew: false
  },
  venue: "MA Chidambaram Stadium, Chepauk, Chennai",
  recentBalls: "1, 2, 1, 6, 0, 4",
  crr: 8.71,
  rrr: 12.33,
  impactPlayerAvailable: false
};

async function executeVerification() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING BACK-TO-BACK VERIFICATION RUNS");
  console.log("=======================================================");

  console.log("\n=== RUNNING TEST SCENARIO 1 (Abhishek Sharma vs Bumrah) ===");
  const result1 = await runCaptainCool(testScenario1);
  
  console.log("\n=== RUNNING TEST SCENARIO 2 (MS Dhoni vs Rashid Khan) ===");
  const result2 = await runCaptainCool(testScenario2);

  console.log("\n=======================================================");
  console.log("📊 SIDE-BY-SIDE VERIFICATION ANALYSIS");
  console.log("=======================================================");
  console.log(`[TEST 1] - ${result1.matchState.battingTeam} Batting`);
  console.log(`- Over: ${result1.matchState.over}, Score: ${result1.matchState.score}/${result1.matchState.wickets}`);
  console.log(`- Pitch: ${result1.matchState.pitchConditions.surface} at ${result1.matchState.venue}`);
  console.log(`- Batsman: ${result1.matchState.striker.name} | Bowler: ${result1.matchState.currentBowler.name}`);
  console.log(`- Analyst keyMatchup: ${result1.agents.statsAnalyst.keyMatchup}`);
  console.log(`- Strategist initial decision: ${result1.agents.strategistInitial.decision}`);
  console.log(`- Devil's Advocate critique: ${result1.agents.devilsAdvocate.challenge}`);
  console.log(`- Devil's Advocate severity: ${result1.agents.devilsAdvocate.severity}`);
  console.log(`- Final Commentator Wrap: ${result1.agents.commentator.decision}`);

  console.log("\n-------------------------------------------------------");
  console.log(`[TEST 2] - ${result2.matchState.battingTeam} Batting`);
  console.log(`- Over: ${result2.matchState.over}, Score: ${result2.matchState.score}/${result2.matchState.wickets}`);
  console.log(`- Pitch: ${result2.matchState.pitchConditions.surface} at ${result2.matchState.venue}`);
  console.log(`- Batsman: ${result2.matchState.striker.name} | Bowler: ${result2.matchState.currentBowler.name}`);
  console.log(`- Analyst keyMatchup: ${result2.agents.statsAnalyst.keyMatchup}`);
  console.log(`- Strategist initial decision: ${result2.agents.strategistInitial.decision}`);
  console.log(`- Devil's Advocate critique: ${result2.agents.devilsAdvocate.challenge}`);
  console.log(`- Devil's Advocate severity: ${result2.agents.devilsAdvocate.severity}`);
  console.log(`- Final Commentator Wrap: ${result2.agents.commentator.decision}`);
  console.log("=======================================================");
}

executeVerification().catch(err => {
  console.error("❌ Verification Execution Error:", err);
});
