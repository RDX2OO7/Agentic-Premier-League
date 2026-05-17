/**
 * Win Probability Tool - "Captain Cool" Multi-Agent Strategy System
 * Calculates the dynamic win probability in a T20/IPL cricket match using a contextual mathematical model.
 */

/**
 * Calculates win probability for the batting team
 * @param {object} matchState - The current state of the match
 * @returns {object} Calculated probabilities, key metrics, and influential factors
 */
export async function calculateWinProbability(matchState) {
  const {
    battingTeam,
    bowlingTeam,
    innings = 1,
    runs = 0,
    wickets = 0,
    overs = 0,
    target = null,
    pitchCondition = "Balanced",
    recentDeliveries = []
  } = matchState;

  // Convert overs (e.g. 16.2) to balls bowled
  const overInt = Math.floor(overs);
  const overFrac = Math.round((overs - overInt) * 10);
  const ballsBowled = (overInt * 6) + overFrac;
  const totalBalls = 120;
  const ballsRemaining = totalBalls - ballsBowled;
  
  const currentRunRate = ballsBowled > 0 ? (runs / ballsBowled) * 6 : 0;
  
  let battingWinProb = 50.0;
  let bowlingWinProb = 50.0;
  let requiredRunRate = 0.0;
  let runsNeeded = 0;
  const factors = [];
  let momentum = "Stable";

  // Calculate momentum from recent deliveries
  if (recentDeliveries && recentDeliveries.length > 0) {
    const boundaryCount = recentDeliveries.filter(d => d === "4" || d === "6" || d === "nb" || d === "wd").length;
    const wicketCount = recentDeliveries.filter(d => d === "W" || d === "w").length;
    
    if (wicketCount >= 2) {
      momentum = "Strong Bowling Momentum (recent wickets)";
    } else if (boundaryCount >= 3) {
      momentum = "Strong Batting Momentum (recent boundaries)";
    } else if (wicketCount === 1) {
      momentum = "Slight Bowling Momentum (recent breakthrough)";
    } else if (boundaryCount >= 1) {
      momentum = "Slight Batting Momentum (scoring active)";
    }
  }

  // --- INNINGS 1 WIN PROBABILITY MODEL ---
  if (innings === 1) {
    // For 1st innings, project the score
    // Historical average T20 par score is ~175
    const parScore = pitchCondition.toLowerCase().includes("flat") || pitchCondition.toLowerCase().includes("dew") ? 190 : 
                     (pitchCondition.toLowerCase().includes("slow") || pitchCondition.toLowerCase().includes("turning") ? 160 : 175);
    
    // Projected runs = (runs scored so far) + (projected runs from remaining balls)
    // Projection adjusts based on wickets lost
    const wicketsFactor = (10 - wickets) / 10; // 1.0 at 0 wickets, 0.1 at 9 wickets
    const standardProjectedRate = 8.5; // average runs per over in middle/death
    const projectedRunsRemaining = (ballsRemaining / 6) * standardProjectedRate * wicketsFactor;
    const projectedFinalScore = Math.round(runs + projectedRunsRemaining);
    
    // Calculate probability based on projected score vs par score
    const scoreDiff = projectedFinalScore - parScore;
    // Map score difference to a probability: every 5 runs above par adds ~2.5% to batting team's win probability
    battingWinProb = 50.0 + (scoreDiff * 0.5);
    
    // Adjust for wickets lost
    if (wickets >= 7 && ballsRemaining > 30) {
      battingWinProb -= 15; // penalize heavily if top/middle order collapsed early
      factors.push(`Severe batting collapse (${wickets} wickets down) limits setting a par score.`);
    } else if (wickets <= 2 && ballsRemaining < 40) {
      battingWinProb += 8; // bonus if wickets in hand for death overs
      factors.push(`Wickets in hand (${10 - wickets} remaining) allows aggressive death overs acceleration.`);
    }

    factors.push(`Projected score is ${projectedFinalScore} vs a pitch par score of ${parScore}.`);
    factors.push(`Current run rate is ${currentRunRate.toFixed(2)} RPO.`);
  } 
  
  // --- INNINGS 2 (CHASING) WIN PROBABILITY MODEL ---
  else if (innings === 2 && target) {
    runsNeeded = target - runs;
    
    if (runsNeeded <= 0) {
      battingWinProb = 100.0;
      bowlingWinProb = 0.0;
    } else if (wickets >= 10) {
      battingWinProb = 0.0;
      bowlingWinProb = 100.0;
    } else if (ballsRemaining <= 0) {
      battingWinProb = 0.0;
      bowlingWinProb = 100.0;
    } else {
      requiredRunRate = (runsNeeded / ballsRemaining) * 6;
      
      // Calculate baseline win probability
      // A standard chase has a base probability that decreases as required run rate exceeds standard rates
      // Base probability based on wickets left vs balls left
      const wicketsLeft = 10 - wickets;
      
      // Calculate batting win score
      // An index combining resource allocation: wickets left and balls left vs runs needed
      const battingResource = (wicketsLeft / 10) * (ballsRemaining / 120);
      const runsPerBallRequired = runsNeeded / ballsRemaining;
      
      // Logistic curve to estimate win probability
      // Exponent factors: wickets remaining, required run rate relative to standard threshold (e.g. 9.0)
      let logOdds = 0.0;
      
      // Wickets remaining has the highest impact on chasing teams
      if (wicketsLeft >= 5) {
        // Safe wickets in hand
        logOdds += (wicketsLeft - 4) * 0.45;
      } else {
        // Crisis wickets
        logOdds -= (5 - wicketsLeft) * 0.9;
      }
      
      // Required run rate impact
      const rrrGap = requiredRunRate - 8.0;
      logOdds -= rrrGap * 0.4;
      
      // Specific adjustments
      // If balls remaining are very few, required run rate becomes extremely critical
      if (ballsRemaining < 18) {
        // Death overs
        const boundaryNeededIndex = requiredRunRate / 6; // e.g. 12 RRR -> 2 runs per ball
        if (boundaryNeededIndex > 2.5 && wicketsLeft < 4) {
          logOdds -= 1.5; // nearly impossible to chase high rates with tail-enders
        }
      }
      
      // Convert log odds to probability
      battingWinProb = 100 / (1 + Math.exp(-logOdds));
      
      // Boundary conditions
      if (battingWinProb > 99) battingWinProb = 99.0;
      if (battingWinProb < 1) battingWinProb = 1.0;
      
      // Let's add readable factors
      factors.push(`${runsNeeded} runs needed off ${ballsRemaining} balls.`);
      factors.push(`Required Run Rate (RRR) is ${requiredRunRate.toFixed(2)} vs Current Run Rate (CRR) of ${currentRunRate.toFixed(2)}.`);
      factors.push(`${wicketsLeft} wickets remaining in the batting lineup.`);
      
      if (requiredRunRate > 12) {
        factors.push("Required run rate has climbed above 12 RPO, putting severe pressure on batsmen.");
      }
      if (wicketsLeft <= 3) {
        factors.push("Batting team is in their tail, heavily reducing their chase capacity.");
      }
    }
  }

  // Adjust for pitch conditions
  if (pitchCondition.toLowerCase().includes("dew")) {
    if (innings === 2) {
      battingWinProb += 5; // Dew makes ball wet, harder for bowlers to grip in 2nd innings
      factors.push("Dew factor: Wet ball will make it difficult for spin bowlers and death bowlers to grip, favoring the batting team.");
    }
  } else if (pitchCondition.toLowerCase().includes("slow") || pitchCondition.toLowerCase().includes("turning")) {
    if (innings === 2 && requiredRunRate > 8.5) {
      battingWinProb -= 6; // Hard to score quick on slow turners
      factors.push("Pitch factor: Sticky/turning pitch makes high-rate chasing extremely challenging.");
    }
  }

  // Ensure bounds
  if (battingWinProb > 100) battingWinProb = 100;
  if (battingWinProb < 0) battingWinProb = 0;
  
  battingWinProb = parseFloat(battingWinProb.toFixed(1));
  bowlingWinProb = parseFloat((100 - battingWinProb).toFixed(1));

  return {
    battingTeam,
    bowlingTeam,
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
