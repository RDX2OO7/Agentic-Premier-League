/**
 * Match State Manager - "Captain Cool" Multi-Agent Strategy System
 * Defines schemas, validates custom match states, and holds pre-configured legendary IPL preset scenarios.
 */

// Classic, high-tension IPL match scenarios to test the agentic reasoning out-of-the-box
export const PRESET_SCENARIOS = {
  "IPL_2019_FINAL": {
    id: "IPL_2019_FINAL",
    title: "IPL 2019 Final: MI vs CSK Last-Over Thriller",
    description: "CSK needs 9 runs in the final over against Lasith Malinga. Shardul Thakur and Ravindra Jadeja are at the crease. Malinga has been expensive, but he has the experience. Who wins the mental chess match?",
    battingTeam: "Chennai Super Kings",
    bowlingTeam: "Mumbai Indians",
    innings: 2,
    runs: 141,
    wickets: 7,
    overs: 19.0, // Last over starts
    target: 150,
    pitchCondition: "Dry, slow, high cracking pressure, some dew",
    batsmen: [
      { name: "Shardul Thakur", runs: 2, balls: 1, isStriker: true },
      { name: "Ravindra Jadeja", runs: 38, balls: 24, isStriker: false }
    ],
    bowler: { name: "Lasith Malinga", overs: 3.0, wickets: 0, runs: 42 },
    recentDeliveries: ["1", "4", "W", "2", "1", "W"] // Previous over
  },
  "KLAASEN_VS_RASHID": {
    id: "KLAASEN_VS_RASHID",
    title: "The Spin Crucible: Heinrich Klaasen vs Rashid Khan",
    description: "In the 14th over, SRH is chasing 180 on a dry pitch. Spin monster Heinrich Klaasen is on strike. Rashid Khan has 2 overs left. Should Rashid bowl defensive lengths or go for the wicket? Should Klaasen attack?",
    battingTeam: "Sunrisers Hyderabad",
    bowlingTeam: "Gujarat Titans",
    innings: 2,
    runs: 130,
    wickets: 3,
    overs: 13.0,
    target: 180,
    pitchCondition: "Dusty, turning pitch with significant grip",
    batsmen: [
      { name: "Heinrich Klaasen", runs: 45, balls: 18, isStriker: true },
      { name: "Nitish Reddy", runs: 12, balls: 10, isStriker: false }
    ],
    bowler: { name: "Rashid Khan", overs: 2.0, wickets: 1, runs: 12 },
    recentDeliveries: ["1", "6", "0", "1", "4", "1"]
  },
  "KOHLI_DEATH_CHASE": {
    id: "KOHLI_DEATH_CHASE",
    title: "King Kohli Chasing at the Death: RCB vs MI",
    description: "RCB needs 42 runs from 18 balls. Virat Kohli is batting on 78* off 48 balls. Jasprit Bumrah is brought on to bowl the 18th over. Does Kohli attack Bumrah, or play him out to target other bowlers?",
    battingTeam: "Royal Challengers Bengaluru",
    bowlingTeam: "Mumbai Indians",
    innings: 2,
    runs: 158,
    wickets: 4,
    overs: 17.0, // 3 overs left
    target: 200,
    pitchCondition: "Flat deck, fast outfield, small boundaries",
    batsmen: [
      { name: "Virat Kohli", runs: 78, balls: 48, isStriker: true },
      { name: "Dinesh Karthik", runs: 4, balls: 2, isStriker: false }
    ],
    bowler: { name: "Jasprit Bumrah", overs: 2.0, wickets: 1, runs: 10 },
    recentDeliveries: ["6", "1", "w", "4", "1", "2"]
  }
};

/**
 * Validates and sanitizes a match state object
 * @param {object} state - The match state to validate
 * @returns {object} Validated and complete match state
 */
export function validateMatchState(state) {
  if (!state || typeof state !== "object") {
    throw new Error("Invalid match state: state must be a valid object.");
  }

  const defaultState = {
    battingTeam: "Chasing Team",
    bowlingTeam: "Defending Team",
    innings: 2,
    runs: 0,
    wickets: 0,
    overs: 0,
    target: null,
    pitchCondition: "Balanced",
    batsmen: [],
    bowler: { name: "Bowler", overs: 0, wickets: 0, runs: 0 },
    recentDeliveries: []
  };

  const validated = { ...defaultState, ...state };

  // Ensure batsmen format is correct
  if (!Array.isArray(validated.batsmen) || validated.batsmen.length === 0) {
    validated.batsmen = [
      { name: "Batsman 1", runs: 0, balls: 0, isStriker: true },
      { name: "Batsman 2", runs: 0, balls: 0, isStriker: false }
    ];
  } else {
    // Ensure striker flag is present
    const hasStriker = validated.batsmen.some(b => b.isStriker);
    if (!hasStriker && validated.batsmen.length > 0) {
      validated.batsmen[0].isStriker = true;
    }
  }

  // Ensure bowler details exist
  if (!validated.bowler || typeof validated.bowler !== "object") {
    validated.bowler = { name: "Bowler", overs: 0, wickets: 0, runs: 0 };
  }

  return validated;
}

/**
 * Serializes the match state into a clean text summary for the AI prompts
 * @param {object} state 
 * @returns {string} String description of current match state
 */
export function formatMatchStateSummary(state) {
  const s = validateMatchState(state);
  const runsNeeded = s.target ? s.target - s.runs : 0;
  
  const overInt = Math.floor(s.overs);
  const overFrac = Math.round((s.overs - overInt) * 10);
  const ballsBowled = (overInt * 6) + overFrac;
  const ballsRemaining = 120 - ballsBowled;

  let summary = `[Match Context]: ${s.battingTeam} is batting against ${s.bowlingTeam}.\n`;
  summary += `Current score: ${s.runs}/${s.wickets} in ${s.overs} overs.\n`;
  
  if (s.innings === 2 && s.target) {
    summary += `Chasing a target of ${s.target}. Needs ${runsNeeded} runs in ${ballsRemaining} balls.\n`;
  } else {
    summary += `Innings 1. Setting a target.\n`;
  }

  summary += `Pitch: ${s.pitchCondition}.\n`;
  
  const striker = s.batsmen.find(b => b.isStriker);
  const nonStriker = s.batsmen.find(b => !b.isStriker);
  
  if (striker) summary += `On Strike: ${striker.name} (${striker.runs} runs off ${striker.balls} balls).\n`;
  if (nonStriker) summary += `Non-Striker: ${nonStriker.name} (${nonStriker.runs} runs off ${nonStriker.balls} balls).\n`;
  if (s.bowler) summary += `Active Bowler: ${s.bowler.name} (${s.bowler.overs} overs, ${s.bowler.wickets} wickets, conceding ${s.bowler.runs} runs).\n`;
  
  return summary;
}
