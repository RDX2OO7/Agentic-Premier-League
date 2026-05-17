# 🏏 Captain Cool: Multi-Agent IPL Cricket Strategy Engine
> *"Dhoni's instinct combined with mathematical data analytics to dominate the death overs."*

[![Gemini 2.5 Flash](https://img.shields.io/badge/Model-Gemini%202.5%20Flash-blueviolet?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Google GenAI SDK](https://img.shields.io/badge/SDK-Google%20GenAI%20SDK-blue?style=for-the-badge&logo=google)](https://github.com/googleapis/nodejs-genai)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20v18%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express%204-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)

**Captain Cool** is an advanced multi-agent tactical simulation platform designed to formulate high-probability strategies for critical match overs in the Indian Premier League (IPL). Powered by **Google Gemini 2.5 Flash** (via the Node.js `@google/genai` SDK) and enhanced with a real-time mathematical T20 win probability engine, the platform models a closed-loop coaching debate to deliver bulletproof tactical recommendations.

---

## 📐 System Architecture

The orchestrator coordinates a structured multi-agent pipeline where decisions are proposed, audited for tail-risks, self-corrected under high-severity conditions, and converted into commentary.

```text
  +---------------------------------------------------+
  |                  User Input                       |
  +-----------------------+---------------------------+
                          |
                          v
  +---------------------------------------------------+
  |                 Orchestrator                      |
  +-----------------------+---------------------------+
                          |
            +-------------+-------------+
            |                           |
            v                           v
  +-------------------+       +-------------------+
  |   Stats Analyst   |       |  Win Probability  |
  |  (Cricbuzz Tools) |       |   Logistic Tool   |
  +---------+---------+       +---------+---------+
            |                           |
            +-------------+-------------+
                          |
                          v
  +---------------------------------------------------+
  |               Strategist (Initial)                |
  +-----------------------+---------------------------+
                          | (First Draft Blueprint)
                          v
  +---------------------------------------------------+
  |                 Devil's Advocate                  |
  +-----------------------+---------------------------+
                          |
            +-------------+-------------+
            |                           |
            | [Severity is "high"]      | [Severity is "medium" / "low"]
            v                           v
  +-------------------+        +-------------------+
  |Strategist Revision|        |   Keep Original   |
  | (Pivot Decision)  |        |     Blueprint     |
  +---------+---------+        +---------+---------+
            |                           |
            +-------------+-------------+
                          |
                          v
  +---------------------------------------------------+
  |                 Match Commentator                 |
  +-----------------------+---------------------------+
                          | (Plain Text Commentary)
                          v
  +---------------------------------------------------+
  |             Visual Tactics Board Output           |
  +---------------------------------------------------+
```

---

## 👥 The Coaching Panel (Agents & Tools)

| Agent / Tool | Role | System Prompt Summary & Responsibility | Tools & APIs Used |
| :--- | :--- | :--- | :--- |
| **Stats Analyst** | Data Engine | Queries player matchups, historical averages, recent form, and venue statistics. Must express insights using metrics. | `getBowlerVsBatsmanRecord`, `getVenueStats` |
| **Strategist** | Captain's Brain | Acts as the tactician (MS Dhoni). Devises field placements, bowler selection, and batting order changes in rich cricket language. | Contextual outputs from Stats Analyst & Win Prob Tool |
| **Devil's Advocate** | Skeptical Coach | Audits the strategist's proposal for vulnerabilities, tail-risks (e.g., heavy dew settling), or fatigue. Outlines severity. | Direct context validation |
| **Commentator** | Broadcast Voice | Merges technical arguments into an exciting, theatrical play-by-play broadcast script. Output is pure on-air text. | Multi-turn debate transcript logs |
| **Win Probability Tool** | Math Calculator | Evaluates RRR vs CRR, wickets down, overs bowled, and pitch settings to compute win probabilities using a sigmoid function. | Native JS math library, exported as Gemini Tool schema |

---

## 🛠️ Installation & Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/RDX2OO7/Agentic-Premier-League.git
cd Agentic-Premier-League/captain-cool
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root of the `captain-cool` directory:
```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key_here
# Optional Cricbuzz bindings
# RAPIDAPI_KEY=your_rapidapi_key_here
```
> [!NOTE]
> If no `GEMINI_API_KEY` is present, the engine automatically activates a high-fidelity **local simulation fallback** to guarantee a fully interactive experience out of the box!

### 4. Start the Server
```bash
npm start
```
Launch your browser and open **[http://localhost:3000](http://localhost:3000)** to interact with the Tactics Board dashboard.

---

## 💬 Sample Input & Orchestrator Debate Log (CSK vs MI, Over 15.0)

### 1. Sample Input Match State
```json
{
  "battingTeam": "Chennai Super Kings",
  "bowlingTeam": "Mumbai Indians",
  "innings": 2,
  "over": 15,
  "ball": 0,
  "currentScore": 120,
  "wickets": 3,
  "targetScore": 185,
  "striker": {
    "name": "Shivam Dube",
    "runs": 34,
    "balls": 18,
    "recentForm": [15, 45, 28, 62, 10]
  },
  "nonStriker": {
    "name": "Ruturaj Gaikwad",
    "runs": 54,
    "balls": 38
  },
  "bowlersAvailable": [
    { "name": "Jasprit Bumrah", "oversBowled": 2.0, "economy": 5.5, "recentForm": [2, 1, 3, 0, 1] }
  ],
  "pitchConditions": {
    "surface": "True batting surface, quick outfield",
    "dew": true,
    "venue": "Wankhede Stadium, Mumbai"
  }
}
```

### 2. Live Orchestrator Debate Logs
```text
==================================================
📊 STATS ANALYST RAW OUTPUT
==================================================
{
  "winProbability": "CSK Win Probability is 39.3% under high dew at Wankhede.",
  "keyMatchup": "Shivam Dube vs Jasprit Bumrah. Bumrah has dismissed Dube once in 18 balls while conceding 1.6 runs per ball.",
  "recommendation": "Shivam Dube must play defensively against Bumrah (rotation strike under 7.0 RPO) and target weaker bowlers in subsequent overs.",
  "confidence": "High (85% confidence based on matchup data)"
}

==================================================
🧠 STRATEGIST (INITIAL DEBATE TURN) RAW OUTPUT
==================================================
{
  "decision": "Rotate strike during Jasprit Bumrah's over; target Gerald Coetzee in the 16th over.",
  "primaryReason": "Shivam Dube averages 16.5 against Bumrah at Wankhede Stadium. Forcing high-risk shots against Bumrah on a slick outfield is suicidal; single rotation is the optimal path.",
  "alternativeConsidered": "Order Dube to target Bumrah's back-of-length deliveries behind deep mid-wicket.",
  "confidenceLevel": "85% - Dhoni's Chill Instinct"
}

==================================================
😈 DEVIL'S ADVOCATE RAW OUTPUT
==================================================
{
  "challenge": "Tactical Risk Warning: The proposed plan relies heavily on perfect bowler length execution and completely ignores Shardul Thakur's explosive trigger against raw pace under heavy dew conditions at Wankhede!",
  "counterDecision": "Hold back your main bowler for one over or immediately swap to off-pace cutters, packing the deep backward square leg zone.",
  "severity": "high"
}

==================================================
🔄 STRATEGIST REVISION (HIGH-SEVERITY PIVOT TRIGGERED)
==================================================
{
  "decision": "Pivot: Hold Shivam Dube back from aggressive drives and swap strikers immediately.",
  "primaryReason": "Acknowledge the Devil's Advocate's crucial warning: forcing Dube into aggressive paced shots against Bumrah on a slick surface is dangerous. We will rotate singles, let him survive Bumrah's over, and save our ammunition for the 17th over.",
  "alternativeConsidered": "Stand ground and rely on Dube's raw power to clear the short boundary despite the slick turf.",
  "confidenceLevel": "95% - Master Pivot"
}

==================================================
🎙️ MATCH COMMENTATOR ON-AIR BROADCAST
==================================================
FINAL DECISION — Acknowledge the high-tension environment and pivot: Shivam Dube is instructed to rotate strike and let the non-striker take the boundary risk against Jasprit Bumrah's lethal spell.

CAPTAIN'S CALL — Look at the dew on the Wankhede grass, it's absolutely slick! Bumrah is firing thunderbolts, bowling with ice in his veins. Forcing Dube to force pace here under pressure is suicidal; we play smart, run hard, and hold our shape.

THE DEBATE — The Devil's Advocate warned that Bumrah's skidding deliveries on slick turf would trap Dube in front, whereas the Strategist initially wanted to charge. Captain Cool calmly pivoted, choosing caution for these six deliveries.

WHY NOT THE OTHER OPTION — Targeting Bumrah was rejected because the risk-adjusted win probability drops by 18% if we lose Dube's wicket now.
```

---

## 🚀 Implemented Stretch Goals

* [x] **High-Fidelity Offline Simulator Mode**: Fully functional system complete with robust mockups matching actual parameters when API quotas are exceeded.
* [x] **Interactive Preset Selector**: Loaded with three historic scenarios mapping exact player profiles.
* [x] **Express Production REST Endpoints**: Implemented clean endpoints (`GET /sample`, `POST /analyze`) supporting rapid automated testing.
* [x] **Premium Dark Turf Tactics Board Dashboard**: Redesigned UI featuring neon outlines, connectable visual timeline steps, and live progress bars showing player matchups analysis.
* [x] **Mathematical Win Probability Engine**: Complete logistic regression algorithm integrating RRR vs CRR margins and environmental variables.
