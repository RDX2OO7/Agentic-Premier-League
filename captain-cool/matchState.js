/**
 * Match State Manager - "Captain Cool" Multi-Agent Strategy System
 * Defines schemas, validates custom match states, and holds pre-configured legendary IPL preset scenarios.
 */

/**
 * Complete IPL Match State Schema represented as a JavaScript Class
 */
export class IPLMatchState {
  /**
   * Constructs an IPLMatchState instance
   * Supports both the new rich object schema and flat legacy properties.
   * @param {object} data - Match state fields
   */
  constructor(data = {}) {
    // --- Direct Schema Fields ---
    this.battingTeam = data.battingTeam || "Chasing Team";
    this.bowlingTeam = data.bowlingTeam || "Defending Team";
    this.innings = data.innings || 2; // 1 or 2
    
    // Core game state
    this.currentScore = data.currentScore !== undefined ? data.currentScore : (data.runs !== undefined ? data.runs : (data.score !== undefined ? data.score : 0));
    this.wickets = data.wickets !== undefined ? data.wickets : 0;
    
    // Parse overs (e.g. 15.0) into discrete over and ball values
    if (data.over !== undefined) {
      this.over = data.over;
      this.ball = data.ball || 0;
    } else if (data.overs !== undefined) {
      this.over = Math.floor(data.overs);
      this.ball = Math.round((data.overs - this.over) * 10);
    } else {
      this.over = 0;
      this.ball = 0;
    }

    // Striker (name, runs, balls, recentForm)
    if (data.striker) {
      this.striker = {
        name: data.striker.name || "Striker",
        runs: data.striker.runs !== undefined ? data.striker.runs : 0,
        balls: data.striker.balls !== undefined ? data.striker.balls : 0,
        recentForm: Array.isArray(data.striker.recentForm) ? data.striker.recentForm : []
      };
    } else if (data.batsmen && data.batsmen.length > 0) {
      const s = data.batsmen.find(b => b.isStriker) || data.batsmen[0];
      this.striker = {
        name: s.name || "Striker",
        runs: s.runs || 0,
        balls: s.balls || 0,
        recentForm: s.recentForm || [24, 45, 12, 68, 18]
      };
    } else {
      this.striker = { name: "Striker", runs: 0, balls: 0, recentForm: [] };
    }

    // NonStriker (name, runs, balls)
    if (data.nonStriker) {
      this.nonStriker = {
        name: data.nonStriker.name || "Non-Striker",
        runs: data.nonStriker.runs !== undefined ? data.nonStriker.runs : 0,
        balls: data.nonStriker.balls !== undefined ? data.nonStriker.balls : 0
      };
    } else if (data.batsmen && data.batsmen.length > 1) {
      const ns = data.batsmen.find(b => !b.isStriker) || data.batsmen[1];
      this.nonStriker = {
        name: ns.name || "Non-Striker",
        runs: ns.runs || 0,
        balls: ns.balls || 0
      };
    } else {
      this.nonStriker = { name: "Non-Striker", runs: 0, balls: 0 };
    }

    // Bowlers Available: array of { name, oversBowled, economy, recentForm }
    if (Array.isArray(data.bowlersAvailable)) {
      this.bowlersAvailable = data.bowlersAvailable.map(b => ({
        name: b.name || "Bowler",
        oversBowled: b.oversBowled !== undefined ? b.oversBowled : 0,
        economy: b.economy !== undefined ? b.economy : 7.0,
        recentForm: Array.isArray(b.recentForm) ? b.recentForm : []
      }));
    } else if (data.currentBowler) {
      this.bowlersAvailable = [
        {
          name: data.currentBowler.name || "Active Bowler",
          oversBowled: data.currentBowler.overs !== undefined ? data.currentBowler.overs : (data.currentBowler.oversBowled || 0),
          economy: data.currentBowler.economy !== undefined ? data.currentBowler.economy : 7.5,
          recentForm: Array.isArray(data.currentBowler.recentForm) ? data.currentBowler.recentForm : [1, 2, 0, 1, 1]
        }
      ];
    } else if (data.bowler) {
      this.bowlersAvailable = [
        {
          name: data.bowler.name || "Active Bowler",
          oversBowled: data.bowler.overs || 0,
          economy: 7.5,
          recentForm: [1, 2, 0, 1, 1]
        }
      ];
    } else {
      this.bowlersAvailable = [];
    }

    // Pitch conditions: { surface, dew, venue }
    const actualVenue = data.venue || (data.pitchConditions && data.pitchConditions.venue) || "IPL Venue";
    if (data.pitchConditions) {
      this.pitchConditions = {
        surface: data.pitchConditions.surface || "Balanced",
        dew: data.pitchConditions.dew !== undefined ? data.pitchConditions.dew : false,
        venue: actualVenue
      };
    } else if (data.pitchCondition) {
      this.pitchConditions = {
        surface: data.pitchCondition,
        dew: data.pitchCondition.toLowerCase().includes("dew"),
        venue: actualVenue
      };
    } else {
      this.pitchConditions = { surface: "Balanced", dew: false, venue: actualVenue };
    }

    // Inning specific metrics
    this.targetScore = data.targetScore !== undefined ? data.targetScore : (data.target || null);
    
    // Automatically calculate or fall back
    const totalBallsBowled = (this.over * 6) + this.ball;
    const ballsRemaining = 120 - totalBallsBowled;
    
    this.currentRunRate = data.currentRunRate || (totalBallsBowled > 0 ? parseFloat(((this.currentScore / totalBallsBowled) * 6).toFixed(2)) : 0.0);
    
    if (this.targetScore) {
      const runsNeeded = this.targetScore - this.currentScore;
      this.requiredRunRate = data.requiredRunRate || (ballsRemaining > 0 ? parseFloat(((runsNeeded / ballsRemaining) * 6).toFixed(2)) : 0.0);
    } else {
      this.requiredRunRate = 0.0;
    }

    this.impactPlayerAvailable = data.impactPlayerAvailable !== undefined ? data.impactPlayerAvailable : true;
    this.powerplayActive = data.powerplayActive !== undefined ? data.powerplayActive : (this.over < 6);
    this.deathOversActive = data.deathOversActive !== undefined ? data.deathOversActive : (this.over >= 15);
    
    // recentBalls: last 12 balls as string
    this.recentBalls = data.recentBalls || (data.recentDeliveries ? data.recentDeliveries.join(",") : "");

    // --- Legacy Fields Mapped for Seamless System Compatibility ---
    // (Ensures backward compatibility with winProbability tool and agents without rewriting them)
    this.runs = this.currentScore;
    this.score = this.currentScore;
    this.crr = this.currentRunRate;
    this.rrr = this.requiredRunRate;
    this.venue = this.pitchConditions.venue;
    this.overs = parseFloat((this.over + (this.ball / 6)).toFixed(1));
    this.target = this.targetScore;
    this.pitchCondition = `${this.pitchConditions.surface} at ${this.pitchConditions.venue}${this.pitchConditions.dew ? ' (Heavy Dew)' : ' (No Dew)'}`;
    this.batsmen = [
      { name: this.striker.name, runs: this.striker.runs, balls: this.striker.balls, isStriker: true, recentForm: this.striker.recentForm },
      { name: this.nonStriker.name, runs: this.nonStriker.runs, balls: this.nonStriker.balls, isStriker: false }
    ];
    this.currentBowler = {
      name: this.bowlersAvailable[0]?.name || "Active Bowler",
      overs: this.bowlersAvailable[0]?.oversBowled || 0,
      economy: this.bowlersAvailable[0]?.economy || 7.5,
      recentForm: this.bowlersAvailable[0]?.recentForm || [1, 2, 0, 1, 1],
      runs: 0
    };
    this.bowler = {
      name: this.currentBowler.name,
      overs: this.currentBowler.overs,
      wickets: 0,
      runs: 0
    };
    this.recentDeliveries = this.recentBalls ? this.recentBalls.split(',').map(s => s.trim()) : [];
  }
}

// Classic, high-tension IPL match scenarios to test the agentic reasoning out-of-the-box
export const PRESET_SCENARIOS = {
  "CSK_VS_MI_OVER_15": {
    id: "CSK_VS_MI_OVER_15",
    title: "CSK vs MI: Wankhede 15th-Over Spin Crucible",
    description: "CSK is chasing 185 against arch-rivals Mumbai Indians. Shivam Dube (striker) is striking well on 34, while skipper Ruturaj Gaikwad anchors on 54. MI has Jasprit Bumrah with 2 death overs remaining. Heavy dew is settling in, making ball-gripping a nightmare. RRR is 13.0 RPO. What is the play?",
    battingTeam: "Chennai Super Kings",
    bowlingTeam: "Mumbai Indians",
    innings: 2,
    over: 15,
    ball: 0,
    currentScore: 120,
    wickets: 3,
    targetScore: 185,
    striker: {
      name: "Shivam Dube",
      runs: 34,
      balls: 18,
      recentForm: [15, 45, 28, 62, 10]
    },
    nonStriker: {
      name: "Ruturaj Gaikwad",
      runs: 54,
      balls: 38
    },
    bowlersAvailable: [
      { name: "Jasprit Bumrah", oversBowled: 2.0, economy: 5.5, recentForm: [2, 1, 3, 0, 1] },
      { name: "Gerald Coetzee", oversBowled: 3.0, economy: 9.2, recentForm: [1, 2, 0, 2, 1] },
      { name: "Piyush Chawla", oversBowled: 3.0, economy: 7.8, recentForm: [0, 1, 1, 2, 0] },
      { name: "Hardik Pandya", oversBowled: 2.0, economy: 8.5, recentForm: [1, 0, 1, 1, 2] }
    ],
    pitchConditions: {
      surface: "True batting surface, quick outfield",
      dew: true,
      venue: "Wankhede Stadium, Mumbai"
    },
    impactPlayerAvailable: true,
    powerplayActive: false,
    deathOversActive: true,
    recentBalls: "1,4,1,6,W,1,0,2,1,4,1,1"
  },
  "IPL_2019_FINAL": {
    id: "IPL_2019_FINAL",
    title: "IPL 2019 Final: MI vs CSK Last-Over Thriller",
    description: "CSK needs 9 runs in the final over against Lasith Malinga. Shardul Thakur and Ravindra Jadeja are at the crease. Malinga has been expensive, but he has the experience. Who wins the mental chess match?",
    battingTeam: "Chennai Super Kings",
    bowlingTeam: "Mumbai Indians",
    innings: 2,
    over: 19,
    ball: 0,
    currentScore: 141,
    wickets: 7,
    targetScore: 150,
    striker: { name: "Shardul Thakur", runs: 2, balls: 1, recentForm: [2, 0, 8, 12, 1] },
    nonStriker: { name: "Ravindra Jadeja", runs: 38, balls: 24 },
    bowlersAvailable: [
      { name: "Lasith Malinga", oversBowled: 3.0, economy: 14.0, recentForm: [0, 0, 2, 1, 0] },
      { name: "Jasprit Bumrah", oversBowled: 4.0, economy: 3.5, recentForm: [2, 1, 2, 0, 1] }
    ],
    pitchConditions: {
      surface: "Dry, slow with high cracking pressure",
      dew: true,
      venue: "Rajiv Gandhi International Cricket Stadium, Hyderabad"
    },
    impactPlayerAvailable: false,
    powerplayActive: false,
    deathOversActive: true,
    recentBalls: "1,4,W,2,1,W"
  },
  "KLAASEN_VS_RASHID": {
    id: "KLAASEN_VS_RASHID",
    title: "The Spin Crucible: Heinrich Klaasen vs Rashid Khan",
    description: "In the 14th over, SRH is chasing 180 on a dry pitch. Spin monster Heinrich Klaasen is on strike. Rashid Khan has 2 overs left. Should Rashid bowl defensive lengths or go for the wicket? Should Klaasen attack?",
    battingTeam: "Sunrisers Hyderabad",
    bowlingTeam: "Gujarat Titans",
    innings: 2,
    over: 13,
    ball: 0,
    currentScore: 130,
    wickets: 3,
    targetScore: 180,
    striker: { name: "Heinrich Klaasen", runs: 45, balls: 18, recentForm: [42, 67, 10, 56, 4] },
    nonStriker: { name: "Nitish Reddy", runs: 12, balls: 10 },
    bowlersAvailable: [
      { name: "Rashid Khan", oversBowled: 2.0, economy: 6.0, recentForm: [1, 2, 0, 1, 2] },
      { name: "Pat Cummins", oversBowled: 1.0, economy: 8.0, recentForm: [2, 3, 1, 0, 2] }
    ],
    pitchConditions: {
      surface: "Dusty turning pitch with significant grip",
      dew: false,
      venue: "Narendra Modi Stadium, Ahmedabad"
    },
    impactPlayerAvailable: true,
    powerplayActive: false,
    deathOversActive: false,
    recentBalls: "1,6,0,1,4,1"
  }
};

/**
 * Validates and sanitizes a match state object
 * Automatically returns a robust IPLMatchState instance.
 * @param {object} state - The match state to validate
 * @returns {IPLMatchState} Validated and complete match state
 */
export function validateMatchState(state) {
  if (state instanceof IPLMatchState) {
    return state;
  }
  return new IPLMatchState(state);
}

/**
 * Serializes the match state into a clean text summary for the AI prompts
 * @param {object} state 
 * @returns {string} String description of current match state
 */
export function formatMatchStateSummary(state) {
  const s = validateMatchState(state);
  const runsNeeded = s.targetScore ? s.targetScore - s.currentScore : 0;
  
  const totalBallsBowled = (s.over * 6) + s.ball;
  const ballsRemaining = 120 - totalBallsBowled;

  let summary = `[Match Context]: ${s.battingTeam} is batting against ${s.bowlingTeam}.\n`;
  summary += `Current score: ${s.currentScore}/${s.wickets} in ${s.over}.${s.ball} overs.\n`;
  
  if (s.innings === 2 && s.targetScore) {
    summary += `Chasing a target of ${s.targetScore}. Needs ${runsNeeded} runs in ${ballsRemaining} balls (RRR: ${s.requiredRunRate} RPO vs CRR: ${s.currentRunRate} RPO).\n`;
  } else {
    summary += `Innings 1. Setting a target (CRR: ${s.currentRunRate} RPO).\n`;
  }

  summary += `Venue: ${s.pitchConditions.venue} | Pitch Surface: ${s.pitchConditions.surface} | Dew: ${s.pitchConditions.dew ? 'Yes' : 'No'}.\n`;
  summary += `Powerplay Active: ${s.powerplayActive ? 'Yes' : 'No'} | Death Overs Active: ${s.deathOversActive ? 'Yes' : 'No'}.\n`;
  
  if (s.striker) {
    summary += `On Strike: ${s.striker.name} (${s.striker.runs} runs off ${s.striker.balls} balls, recent IPL form: [${(s.striker.recentForm || []).join(', ')}]).\n`;
  }
  if (s.nonStriker) {
    summary += `Non-Striker: ${s.nonStriker.name} (${s.nonStriker.runs} runs off ${s.nonStriker.balls} balls).\n`;
  }
  
  if (s.bowlersAvailable && s.bowlersAvailable.length > 0) {
    summary += `Available Bowlers for the inning:\n`;
    s.bowlersAvailable.forEach(b => {
      summary += `- ${b.name} (${b.oversBowled} overs bowled, Economy: ${b.economy}, recent form: [${(b.recentForm || []).join(', ')}])\n`;
    });
  }
  
  return summary;
}

// Export a sample match state for CSK vs MI, over 15, 2nd innings, target 185, score 120/3
export const SAMPLE_MATCH_STATE = new IPLMatchState(PRESET_SCENARIOS.CSK_VS_MI_OVER_15);
