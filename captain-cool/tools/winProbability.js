/**
 * Win Probability Tool - "Captain Cool" Multi-Agent Strategy System
 * Calculates the T20/IPL cricket win probability percentage using a robust logistic regression model.
 * Serves as both a native JS helper and a Gemini function-calling tool.
 */

/**
 * Calculates win probability for the batting team using logistic regression.
 * Supports both direct parameter objects (Gemini tool calls) and the standard MatchState structure.
 * @param {object} params - Input parameters
 * @returns {object} Calculated probabilities, key metrics, and key factors
 */
export async function calculateWinProbability(params = {}) {
  // Support both tool arguments and raw match state mappings
  const innings = params.innings || 2;
  const overVal = params.over !== undefined ? params.over : (params.overs || 0);
  const scoreVal = params.score !== undefined ? params.score : (params.runs || 0);
  const wicketsVal = params.wickets !== undefined ? params.wickets : 0;
  const targetVal = params.target !== undefined ? params.target : (params.targetScore || null);
  const pitchStr = params.pitchFactor || params.pitchCondition || "Balanced";

  // Convert overs (e.g., 15.0 or 15.3) to balls bowled
  const overInt = Math.floor(overVal);
  const overFrac = Math.round((overVal - overInt) * 10);
  const ballsBowled = (overInt * 6) + overFrac;
  const totalBalls = 120;
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const oversRemaining = ballsRemaining / 6;

  const currentRunRate = ballsBowled > 0 ? (scoreVal / ballsBowled) * 6 : 0;
  const wicketsLeft = 10 - wicketsVal;
  
  let battingWinProb = 50.0;
  let bowlingWinProb = 50.0;
  let requiredRunRate = 0.0;
  let runsNeeded = 0;
  const factors = [];
  let momentum = "Stable";

  // --- INNINGS 2 (CHASING) LOGISTIC REGRESSION MODEL ---
  if (innings === 2 && targetVal) {
    runsNeeded = targetVal - scoreVal;
    
    if (runsNeeded <= 0) {
      battingWinProb = 100.0;
      bowlingWinProb = 0.0;
    } else if (wicketsVal >= 10) {
      battingWinProb = 0.0;
      bowlingWinProb = 100.0;
    } else if (ballsRemaining <= 0) {
      battingWinProb = 0.0;
      bowlingWinProb = 100.0;
    } else {
      requiredRunRate = (runsNeeded / ballsRemaining) * 6;
      
      // Logistic Regression Formula based on RRR, CRR, wickets in hand, and overs remaining.
      // Sigmoid Function: P(win) = 1 / (1 + exp(-y))
      // y (log odds) = beta_0 + beta_1 * wickets_left + beta_2 * (crr - rrr) + beta_3 * interaction
      let logOdds = -0.5; // Baseline intercept
      
      // Coefficient for resource index: Wickets remaining in hand (extremely critical)
      logOdds += 0.65 * wicketsLeft;
      
      // Coefficient for Run Rate Difference: CRR - RRR
      const rrDiff = currentRunRate - requiredRunRate;
      logOdds += 0.45 * rrDiff;
      
      // Interaction term: high required run rates squeeze the batting odds exponentially as overs run out
      if (requiredRunRate > 10.0) {
        logOdds -= 0.18 * (requiredRunRate - 10.0) * (20 - oversRemaining);
      } else {
        logOdds += 0.06 * (10.0 - requiredRunRate) * (20 - oversRemaining);
      }
      
      // Environmental Pitch Factors
      if (pitchStr.toLowerCase().includes("dew")) {
        // Wet ball, harder to bowl / field, favors chasing batting team
        logOdds += 0.4;
      }
      if (pitchStr.toLowerCase().includes("slow") || pitchStr.toLowerCase().includes("turning")) {
        // Gripping, tacky pitch makes death over boundary hitting very difficult
        logOdds -= 0.55;
      }
      
      // Calculate Sigmoid Probability
      const prob = 1 / (1 + Math.exp(-logOdds));
      battingWinProb = parseFloat((prob * 100).toFixed(1));
      
      // Keep boundaries realistic to prevent perfect certainty unless mathematically over
      if (battingWinProb > 99.5) battingWinProb = 99.5;
      if (battingWinProb < 0.5) battingWinProb = 0.5;
      
      factors.push(`${runsNeeded} runs needed off ${ballsRemaining} balls.`);
      factors.push(`Required Run Rate (RRR) is ${requiredRunRate.toFixed(2)} vs Current Run Rate (CRR) of ${currentRunRate.toFixed(2)}.`);
      factors.push(`${wicketsLeft} wickets remaining in the batting lineup.`);
      
      if (requiredRunRate > 12) {
        factors.push("Required run rate has climbed above 12 RPO, putting severe pressure on batsmen.");
      }
      if (wicketsLeft <= 3) {
        factors.push("Batting team is in their tail, heavily reducing their chase capacity.");
      }
      if (pitchStr.toLowerCase().includes("dew")) {
        factors.push("Dew factor: Wet ball will make it difficult for spin bowlers and death bowlers to grip, favoring the batting team.");
      }
    }
  } 
  // --- INNINGS 1 LOGISTIC REGRESSION PAR SCORE MODEL ---
  else {
    const parScore = pitchStr.toLowerCase().includes("flat") || pitchStr.toLowerCase().includes("dew") ? 190 : 
                     (pitchStr.toLowerCase().includes("slow") || pitchStr.toLowerCase().includes("turning") ? 160 : 175);
    
    const wicketsFactor = wicketsLeft / 10;
    const standardProjectedRate = 8.5;
    const projectedRunsRemaining = (ballsRemaining / 6) * standardProjectedRate * wicketsFactor;
    const projectedFinalScore = Math.round(scoreVal + projectedRunsRemaining);
    
    const scoreDiff = projectedFinalScore - parScore;
    let logOdds = 0.05 * scoreDiff + 0.1 * wicketsLeft - 0.5;
    
    const prob = 1 / (1 + Math.exp(-logOdds));
    battingWinProb = parseFloat((prob * 100).toFixed(1));
    
    if (battingWinProb > 99) battingWinProb = 99.0;
    if (battingWinProb < 1) battingWinProb = 1.0;
    
    factors.push(`Projected score is ${projectedFinalScore} vs a pitch par score of ${parScore}.`);
    factors.push(`Current run rate is ${currentRunRate.toFixed(2)} RPO.`);
  }

  // Ensure bounds
  if (battingWinProb > 100) battingWinProb = 100;
  if (battingWinProb < 0) battingWinProb = 0;
  
  battingWinProb = parseFloat(battingWinProb.toFixed(1));
  bowlingWinProb = parseFloat((100 - battingWinProb).toFixed(1));

  // Determine simple momentum
  if (params.recentDeliveries && params.recentDeliveries.length > 0) {
    const boundaryCount = params.recentDeliveries.filter(d => d === "4" || d === "6").length;
    const wicketCount = params.recentDeliveries.filter(d => d === "W" || d === "w").length;
    if (wicketCount >= 2) momentum = "Strong Bowling Momentum";
    else if (boundaryCount >= 3) momentum = "Strong Batting Momentum";
    else if (wicketCount === 1) momentum = "Bowling Momentum Shift";
    else if (boundaryCount >= 1) momentum = "Batting Momentum Shift";
  }

  return {
    battingTeam: params.battingTeam || "Batting Team",
    bowlingTeam: params.bowlingTeam || "Bowling Team",
    battingWinProb,
    bowlingWinProb,
    requiredRunRate: parseFloat(requiredRunRate.toFixed(2)),
    currentRunRate: parseFloat(currentRunRate.toFixed(2)),
    runsNeeded,
    ballsRemaining,
    factors,
    momentum
  };
}

/**
 * Gemini tool definition object for use with @google/genai function calling
 */
export const calculateWinProbabilityTool = {
  name: "calculateWinProbability",
  description: "Calculates the T20/IPL cricket win probability percentage for the batting team using a logistic regression formula based on required run rate vs current run rate, wickets in hand, and overs remaining.",
  parameters: {
    type: "OBJECT",
    properties: {
      innings: {
        type: "INTEGER",
        description: "The current innings of the match (1 or 2)."
      },
      over: {
        type: "NUMBER",
        description: "The number of overs bowled so far in the inning (can be a decimal, e.g. 15.0 or 15.3)."
      },
      score: {
        type: "INTEGER",
        description: "The current runs scored by the batting team."
      },
      wickets: {
        type: "INTEGER",
        description: "The number of wickets lost by the batting team (0 to 9)."
      },
      target: {
        type: "INTEGER",
        description: "The target score to chase set in the 1st innings (only required in 2nd innings)."
      },
      pitchFactor: {
        type: "STRING",
        description: "Pitch surface conditions, venue name, and environment factors like dew (e.g. 'slow turner with heavy dew')."
      }
    },
    required: ["innings", "over", "score", "wickets", "pitchFactor"]
  }
};
