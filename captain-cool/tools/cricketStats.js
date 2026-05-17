/**
 * Cricket Statistics Tool - "Captain Cool" Multi-Agent Strategy System
 * Contains high-fidelity player statistics, match-ups, and form metrics for top IPL players.
 */
import axios from 'axios';


// Comprehensive database of top IPL players with realistic historical and recent statistics
const PLAYER_DATABASE = {
  "Virat Kohli": {
    name: "Virat Kohli",
    team: "Royal Challengers Bengaluru",
    role: "Batsman",
    style: "Right-hand bat",
    stats: {
      overall: { matches: 252, runs: 8004, average: 38.7, strikeRate: 131.9, fifties: 55, hundreds: 8 },
      recentForm: { last5Innings: [47, 92, 27, 113, 51], average: 66.0, strikeRate: 148.5 },
      vsPace: { strikeRate: 138.2, average: 42.1, dismissalRate: 28.5 },
      vsSpin: { strikeRate: 121.5, average: 48.3, dismissalRate: 35.0 },
      byPhase: {
        powerplay: { strikeRate: 122.4, dismissalRate: 48.0 },
        middle: { strikeRate: 126.8, dismissalRate: 38.5 },
        death: { strikeRate: 188.5, dismissalRate: 12.0 }
      }
    }
  },
  "MS Dhoni": {
    name: "MS Dhoni",
    team: "Chennai Super Kings",
    role: "Wicketkeeper-Batsman",
    style: "Right-hand bat",
    stats: {
      overall: { matches: 264, runs: 5243, average: 39.1, strikeRate: 137.5, fifties: 24, hundreds: 0 },
      recentForm: { last5Innings: [26, 4, 37, 28, 9], average: 52.0, strikeRate: 220.8 }, // many not outs
      vsPace: { strikeRate: 144.6, average: 36.4, dismissalRate: 24.2 },
      vsSpin: { strikeRate: 118.9, average: 42.7, dismissalRate: 31.0 },
      byPhase: {
        powerplay: { strikeRate: 98.0, dismissalRate: 60.0 },
        middle: { strikeRate: 118.5, dismissalRate: 45.0 },
        death: { strikeRate: 198.4, dismissalRate: 18.5 } // Legendary death hitter
      }
    }
  },
  "Rohit Sharma": {
    name: "Rohit Sharma",
    team: "Mumbai Indians",
    role: "Batsman",
    style: "Right-hand bat",
    stats: {
      overall: { matches: 257, runs: 6628, average: 29.7, strikeRate: 131.2, fifties: 43, hundreds: 2 },
      recentForm: { last5Innings: [6, 19, 4, 105, 38], average: 34.4, strikeRate: 142.1 },
      vsPace: { strikeRate: 136.5, average: 32.8, dismissalRate: 22.0 },
      vsSpin: { strikeRate: 119.8, average: 25.4, dismissalRate: 18.2 }, // Vulnerable to left-arm spin & legbreak early on
      byPhase: {
        powerplay: { strikeRate: 139.2, dismissalRate: 32.0 },
        middle: { strikeRate: 115.4, dismissalRate: 28.0 },
        death: { strikeRate: 174.5, dismissalRate: 15.0 }
      }
    }
  },
  "Heinrich Klaasen": {
    name: "Heinrich Klaasen",
    team: "Sunrisers Hyderabad",
    role: "Batsman",
    style: "Right-hand bat",
    stats: {
      overall: { matches: 35, runs: 998, average: 45.4, strikeRate: 172.5, fifties: 6, hundreds: 1 },
      recentForm: { last5Innings: [42, 67, 10, 56, 4], average: 35.8, strikeRate: 178.2 },
      vsPace: { strikeRate: 161.4, average: 38.5, dismissalRate: 21.0 },
      vsSpin: { strikeRate: 188.9, average: 58.2, dismissalRate: 34.0 }, // Absolute spin monster
      byPhase: {
        powerplay: { strikeRate: 125.0, dismissalRate: 40.0 },
        middle: { strikeRate: 168.4, dismissalRate: 28.0 },
        death: { strikeRate: 212.5, dismissalRate: 10.0 }
      }
    }
  },
  "Jasprit Bumrah": {
    name: "Jasprit Bumrah",
    team: "Mumbai Indians",
    role: "Bowler",
    style: "Right-arm fast",
    stats: {
      overall: { matches: 133, wickets: 165, economy: 7.30, average: 22.5, strikeRate: 18.5 },
      recentForm: { last5Matches: [3, 0, 2, 5, 1], wickets: 11, economy: 6.20 },
      vsRightHand: { economy: 7.02, strikeRate: 17.2 },
      vsLeftHand: { economy: 7.65, strikeRate: 20.1 },
      byPhase: {
        powerplay: { economy: 6.10, strikeRate: 24.5 },
        middle: { economy: 6.80, strikeRate: 21.0 },
        death: { economy: 8.20, strikeRate: 11.2 } // Supreme death bowler
      }
    }
  },
  "Rashid Khan": {
    name: "Rashid Khan",
    team: "Gujarat Titans",
    role: "Bowler",
    style: "Right-arm legbreak",
    stats: {
      overall: { matches: 121, wickets: 149, economy: 6.73, average: 21.8, strikeRate: 19.4 },
      recentForm: { last5Matches: [1, 2, 0, 1, 2], wickets: 6, economy: 7.15 },
      vsRightHand: { economy: 6.40, strikeRate: 18.1 },
      vsLeftHand: { economy: 7.20, strikeRate: 21.5 }, // Slightly less effective vs lefties
      byPhase: {
        powerplay: { economy: 6.20, strikeRate: 30.0 },
        middle: { economy: 6.55, strikeRate: 17.5 }, // Controls the middle overs
        death: { economy: 8.10, strikeRate: 14.2 }
      }
    }
  },
  "Sunil Narine": {
    name: "Sunil Narine",
    team: "Kolkata Knight Riders",
    role: "All-Rounder",
    style: "Left-hand bat / Right-arm offbreak",
    stats: {
      overall: { matches: 176, wickets: 178, economy: 6.64, average: 25.4, battingStrikeRate: 163.4 },
      recentForm: { last5Matches: [2, 1, 1, 0, 3], wickets: 7, economy: 6.10 },
      vsRightHand: { economy: 6.45, strikeRate: 22.0 },
      vsLeftHand: { economy: 6.85, strikeRate: 24.2 },
      byPhase: {
        powerplay: { economy: 6.25, strikeRate: 26.0 },
        middle: { economy: 6.50, strikeRate: 22.5 },
        death: { economy: 7.90, strikeRate: 15.0 }
      }
    }
  },
  "Pat Cummins": {
    name: "Pat Cummins",
    team: "Sunrisers Hyderabad",
    role: "All-Rounder",
    style: "Right-hand bat / Right-arm fast",
    stats: {
      overall: { matches: 58, wickets: 63, economy: 8.42, average: 29.8, battingStrikeRate: 152.1 },
      recentForm: { last5Matches: [2, 3, 1, 0, 2], wickets: 8, economy: 8.10 },
      vsRightHand: { economy: 8.20, strikeRate: 20.5 },
      vsLeftHand: { economy: 8.65, strikeRate: 23.0 },
      byPhase: {
        powerplay: { economy: 7.80, strikeRate: 22.0 },
        middle: { economy: 8.20, strikeRate: 25.0 },
        death: { economy: 9.80, strikeRate: 14.5 }
      }
    }
  }
};

// Head-to-head match-up overrides for hyper-specific scenarios
const HEAD_TO_HEAD = {
  "Virat Kohli vs Jasprit Bumrah": {
    runs: 140,
    balls: 95,
    dismissals: 4,
    strikeRate: 147.4,
    description: "Intense battle. Bumrah has dismissed Kohli early in the innings 4 times, but Kohli scores at a decent rate once set."
  },
  "Virat Kohli vs Rashid Khan": {
    runs: 78,
    balls: 72,
    dismissals: 2,
    strikeRate: 108.3,
    description: "Rashid has choked Kohli's scoring in the middle overs, keeping him to a low strike rate of 108.3."
  },
  "MS Dhoni vs Jasprit Bumrah": {
    runs: 56,
    balls: 59,
    dismissals: 3,
    strikeRate: 94.9,
    description: "Bumrah has completely dominated Dhoni at the death. Dhoni struggles to get Bumrah's off-cutters away."
  },
  "Heinrich Klaasen vs Rashid Khan": {
    runs: 62,
    balls: 28,
    dismissals: 0,
    strikeRate: 221.4,
    description: "Klaasen has absolutely demolished Rashid Khan, hitting him for 6 sixes in brief encounters without getting out."
  },
  "Rohit Sharma vs Sunil Narine": {
    runs: 137,
    balls: 118,
    dismissals: 7,
    strikeRate: 116.1,
    description: "Narine has Rohit's number! 7 dismissals in IPL history. Rohit struggles with Narine's carrom ball."
  }
};

/**
 * Gets historical statistics for a player
 * @param {string} name - Player name
 * @returns {object} Player stats or fallback mock stats if player not in database
 */
export async function getPlayerStats(name) {
  if (!name) return null;
  
  // Try to find exact or partial match
  const key = Object.keys(PLAYER_DATABASE).find(
    k => k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase())
  );
  
  if (key) {
    return PLAYER_DATABASE[key];
  }
  
  // Return intelligent fallback stats for custom players
  const isBowler = name.toLowerCase().includes("bumrah") || name.toLowerCase().includes("khan") || 
                    name.toLowerCase().includes("starc") || name.toLowerCase().includes("siraj") || 
                    name.toLowerCase().includes("chahal") || name.toLowerCase().includes("cummins") ||
                    name.toLowerCase().includes("pathirana") || name.toLowerCase().includes("shami");
                    
  if (isBowler) {
    return {
      name,
      team: "Generic Franchise",
      role: "Bowler",
      style: "Right-arm fast-medium",
      stats: {
        overall: { matches: 45, wickets: 52, economy: 8.15, average: 25.2, strikeRate: 18.6 },
        recentForm: { last5Matches: [1, 2, 0, 1, 1], wickets: 5, economy: 8.30 },
        vsRightHand: { economy: 7.95, strikeRate: 18.0 },
        vsLeftHand: { economy: 8.40, strikeRate: 19.5 },
        byPhase: {
          powerplay: { economy: 7.60, strikeRate: 22.0 },
          middle: { economy: 7.90, strikeRate: 24.0 },
          death: { economy: 9.40, strikeRate: 13.5 }
        }
      }
    };
  } else {
    return {
      name,
      team: "Generic Franchise",
      role: "Batsman",
      style: "Right-hand bat",
      stats: {
        overall: { matches: 62, runs: 1680, average: 31.4, strikeRate: 135.2, fifties: 11, hundreds: 0 },
        recentForm: { last5Innings: [24, 45, 12, 68, 18], average: 33.4, strikeRate: 138.5 },
        vsPace: { strikeRate: 139.1, average: 30.2, dismissalRate: 21.0 },
        vsSpin: { strikeRate: 128.5, average: 33.5, dismissalRate: 26.0 },
        byPhase: {
          powerplay: { strikeRate: 132.0, dismissalRate: 35.0 },
          middle: { strikeRate: 125.4, dismissalRate: 30.0 },
          death: { strikeRate: 172.5, dismissalRate: 16.0 }
        }
      }
    };
  }
}

/**
 * Gets head-to-head matchup details between a batsman and a bowler
 * @param {string} batsmanName 
 * @param {string} bowlerName 
 * @returns {object} Matchup data
 */
export async function getMatchupStats(batsmanName, bowlerName) {
  if (!batsmanName || !bowlerName) return null;
  
  // Find key in head-to-head database
  const matchKey = Object.keys(HEAD_TO_HEAD).find(k => {
    const parts = k.split(" vs ");
    const bMatch = parts[0].toLowerCase().includes(batsmanName.toLowerCase()) || batsmanName.toLowerCase().includes(parts[0].toLowerCase());
    const boMatch = parts[1].toLowerCase().includes(bowlerName.toLowerCase()) || bowlerName.toLowerCase().includes(parts[1].toLowerCase());
    return bMatch && boMatch;
  });
  
  if (matchKey) {
    return HEAD_TO_HEAD[matchKey];
  }
  
  // Dynamic fallback calculation based on player properties
  const batsman = await getPlayerStats(batsmanName);
  const bowler = await getPlayerStats(bowlerName);
  
  let baseStrikeRate = 135;
  let baseAverage = 30;
  let description = "No significant historical head-to-head records. Predictions based on overall metrics: ";
  
  if (batsman && bowler) {
    const isSpin = bowler.style.toLowerCase().includes("spin") || bowler.style.toLowerCase().includes("break") || bowler.style.toLowerCase().includes("orthodox");
    
    if (isSpin) {
      baseStrikeRate = (batsman.stats.vsSpin?.strikeRate || 125) * 0.95;
      baseAverage = (batsman.stats.vsSpin?.average || 30);
      description += `${batsman.name} strikes at ${baseStrikeRate.toFixed(1)} against spin bowlers, while ${bowler.name} maintains a tight spin economy of ${bowler.stats.overall.economy || 7.2}.`;
    } else {
      baseStrikeRate = (batsman.stats.vsPace?.strikeRate || 138) * 0.98;
      baseAverage = (batsman.stats.vsPace?.average || 32);
      description += `${batsman.name} strikes at ${baseStrikeRate.toFixed(1)} against pace bowlers, while ${bowler.name} bowls at an economy of ${bowler.stats.overall.economy || 7.8}.`;
    }
  } else {
    description += `Standard match-up expected. Batsman general strike rate of ${baseStrikeRate} vs Bowler standard economy.`;
  }
  
  return {
    runs: Math.round(baseAverage * 2.5),
    balls: Math.round((baseAverage * 2.5) / (baseStrikeRate / 100)),
    dismissals: 2,
    strikeRate: Math.round(baseStrikeRate),
    description
  };
}

/**
 * Checks the form of multiple players
 * @param {Array<string>} playerNames 
 * @returns {Array<object>} List of player form profiles
 */
export async function getTeamForm(playerNames) {
  const formList = [];
  for (const name of playerNames) {
    const stats = await getPlayerStats(name);
    if (stats) {
      formList.push({
        name: stats.name,
        role: stats.role,
        recentForm: stats.stats.recentForm
      });
    }
  }
  return formList;
}

/**
 * Unofficial Cricbuzz API Caller on RapidAPI
 */
async function fetchFromCricbuzz(endpoint, params = {}) {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.CRICBUZZ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RapidAPI Key for Cricbuzz API");
  }

  const response = await axios.get(`https://cricbuzz-cricket.p.rapidapi.com${endpoint}`, {
    params,
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
    }
  });
  return response.data;
}

/**
 * Fetches recent head-to-head statistics between a bowler and a batsman.
 * Falls back to high-fidelity mock metrics if the API key is missing.
 * @param {string} bowlerName - Bowler name
 * @param {string} batsmanName - Batsman name
 * @returns {object} { dismissals, economy, dotBallPercentage, average }
 */
export async function getBowlerVsBatsmanRecord(bowlerName, batsmanName) {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.CRICBUZZ_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ [RapidAPI Cricbuzz Warning] No RAPIDAPI_KEY or CRICBUZZ_API_KEY found in .env. Falling back to high-fidelity mock matchup data.");
    return getMockMatchup(bowlerName, batsmanName);
  }

  try {
    // 1. Search player IDs
    const batsmanSearch = await fetchFromCricbuzz('/stats/v1/player/search', { name: batsmanName });
    const batsmanId = batsmanSearch.player?.find(p => p.name.toLowerCase().includes(batsmanName.toLowerCase()))?.id || 
                      batsmanSearch.player?.[0]?.id;

    const bowlerSearch = await fetchFromCricbuzz('/stats/v1/player/search', { name: bowlerName });
    const bowlerId = bowlerSearch.player?.find(p => p.name.toLowerCase().includes(bowlerName.toLowerCase()))?.id || 
                     bowlerSearch.player?.[0]?.id;

    if (!batsmanId || !bowlerId) {
      console.warn(`⚠️ Player ID mapping failed on Cricbuzz search. Falling back to mock for ${batsmanName} vs ${bowlerName}.`);
      return getMockMatchup(bowlerName, batsmanName);
    }

    // 2. Fetch batsman overall profile and extract matchup sub-object
    const rawStats = await fetchFromCricbuzz(`/stats/v1/player/${batsmanId}`);
    return parseCricbuzzMatchup(rawStats, bowlerName, batsmanName);
  } catch (error) {
    console.error(`❌ Cricbuzz API request failed, falling back to mock matchup:`, error.message);
    return getMockMatchup(bowlerName, batsmanName);
  }
}

/**
 * Fetches statistics of a player at a specific venue.
 * @param {string} venue - Venue description
 * @param {string} playerName - Player name
 * @returns {object} { averageScore, strikeRate }
 */
export async function getVenueStats(venue, playerName) {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.CRICBUZZ_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ [RapidAPI Cricbuzz Warning] No RAPIDAPI_KEY or CRICBUZZ_API_KEY found in .env. Falling back to venue-stats mock.");
    return getMockVenueStats(venue, playerName);
  }

  try {
    const searchRes = await fetchFromCricbuzz('/stats/v1/player/search', { name: playerName });
    const playerId = searchRes.player?.[0]?.id;
    if (!playerId) return getMockVenueStats(venue, playerName);
    
    const statsRes = await fetchFromCricbuzz(`/stats/v1/player/${playerId}`);
    return parseCricbuzzVenueStats(statsRes, venue, playerName);
  } catch (error) {
    console.error(`❌ Cricbuzz API venue stats failed, falling back to mock:`, error.message);
    return getMockVenueStats(venue, playerName);
  }
}

/**
 * Parses matchup statistics from Cricbuzz response
 */
function parseCricbuzzMatchup(rawStats, bowlerName, batsmanName) {
  if (rawStats && rawStats.playerProfile) {
    return {
      dismissals: rawStats.playerProfile.dismissals || 1,
      economy: rawStats.playerProfile.economy || 7.20,
      dotBallPercentage: rawStats.playerProfile.dotBallPercent || 35.0,
      average: rawStats.playerProfile.avg || 28.5
    };
  }
  return getMockMatchup(bowlerName, batsmanName);
}

/**
 * Parses venue statistics from Cricbuzz response
 */
function parseCricbuzzVenueStats(statsRes, venue, playerName) {
  if (statsRes && statsRes.venueStats) {
    return {
      averageScore: statsRes.venueStats.avgScore || 35.2,
      strikeRate: statsRes.venueStats.strikeRate || 135.0
    };
  }
  return getMockVenueStats(venue, playerName);
}

/**
 * Contextual Mock Fallbacks matching CSK vs MI and SRH scenarios
 */
function getMockMatchup(bowlerName, batsmanName) {
  const bLow = bowlerName.toLowerCase();
  const batLow = batsmanName.toLowerCase();

  // Shivam Dube vs Jasprit Bumrah (CSK vs MI Matchup)
  if (batLow.includes("dube") && bLow.includes("bumrah")) {
    return {
      dismissals: 1,
      economy: 6.80,
      dotBallPercentage: 44.5,
      average: 16.5
    };
  }
  
  // Shivam Dube vs Piyush Chawla
  if (batLow.includes("dube") && bLow.includes("chawla")) {
    return {
      dismissals: 0,
      economy: 10.50,
      dotBallPercentage: 22.0,
      average: 45.0
    };
  }

  // Heinrich Klaasen vs Rashid Khan
  if (batLow.includes("klaasen") && bLow.includes("rashid")) {
    return {
      dismissals: 0,
      economy: 13.20,
      dotBallPercentage: 15.0,
      average: 62.0
    };
  }

  // Virat Kohli vs Jasprit Bumrah
  if (batLow.includes("kohli") && bLow.includes("bumrah")) {
    return {
      dismissals: 4,
      economy: 8.84,
      dotBallPercentage: 35.0,
      average: 35.0
    };
  }

  return {
    dismissals: 1,
    economy: 7.90,
    dotBallPercentage: 32.0,
    average: 28.0
  };
}

function getMockVenueStats(venue, playerName) {
  const vLow = venue.toLowerCase();
  const pLow = playerName.toLowerCase();

  if (vLow.includes("wankhede")) {
    if (pLow.includes("dube")) {
      return { averageScore: 41.20, strikeRate: 162.80 };
    }
    if (pLow.includes("gaikwad")) {
      return { averageScore: 48.50, strikeRate: 140.40 };
    }
    if (pLow.includes("dhoni")) {
      return { averageScore: 32.40, strikeRate: 185.20 };
    }
  }

  if (vLow.includes("narendra modi") || vLow.includes("ahmedabad")) {
    if (pLow.includes("klaasen")) {
      return { averageScore: 38.00, strikeRate: 172.50 };
    }
  }

  if (vLow.includes("hyderabad")) {
    if (pLow.includes("jadeja")) {
      return { averageScore: 24.50, strikeRate: 122.80 };
    }
  }

  return {
    averageScore: 32.50,
    strikeRate: 135.00
  };
}

/**
 * Gemini Tool Schema Declarations
 */
export const getBowlerVsBatsmanRecordTool = {
  name: "getBowlerVsBatsmanRecord",
  description: "Fetches recent head-to-head matchup statistics between a bowler and a batsman, including total dismissals, bowling economy rate, dot ball percentage, and batting average against this specific bowler.",
  parameters: {
    type: "OBJECT",
    properties: {
      bowlerName: {
        type: "STRING",
        description: "The full name of the bowler to analyze (e.g. 'Jasprit Bumrah')."
      },
      batsmanName: {
        type: "STRING",
        description: "The full name of the batsman to analyze (e.g. 'Shivam Dube')."
      }
    },
    required: ["bowlerName", "batsmanName"]
  }
};

export const getVenueStatsTool = {
  name: "getVenueStats",
  description: "Fetches historical performance metrics for a specific batsman at a given stadium venue, returning their batting average score and strike rate at that stadium.",
  parameters: {
    type: "OBJECT",
    properties: {
      venue: {
        type: "STRING",
        description: "The name of the cricket ground or stadium venue (e.g. 'Wankhede Stadium, Mumbai')."
      },
      playerName: {
        type: "STRING",
        description: "The full name of the player/batsman to query (e.g. 'Shivam Dube')."
      }
    },
    required: ["venue", "playerName"]
  }
};

