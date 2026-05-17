/**
 * Captain Cool - Multi-Agent IPL Cricket Strategy System Entry Point
 * Sets up an Express server to expose APIs and host a stunning web-based visual dashboard.
 */

import 'dotenv/config'; // Loads .env variables automatically
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runStrategySystem, runCaptainCool } from './orchestrator.js';
import { PRESET_SCENARIOS, validateMatchState, IPLMatchState, SAMPLE_MATCH_STATE } from './matchState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static dashboard files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * API: Get the CSK vs MI sample match state
 */
app.get('/sample', (req, res) => {
  res.json(SAMPLE_MATCH_STATE);
});

/**
 * API: Analyze match state - returns full debate transcript + final commentary
 */
app.post('/analyze', async (req, res) => {
  console.log("📥 Received POST /analyze match state payload:");
  console.log(JSON.stringify(req.body, null, 2));

  // Input validation check (STEP 7)
  if (!req.body || req.body.striker === undefined || req.body.over === undefined) {
    console.error("❌ Validation Failed: Incomplete match state received.");
    return res.status(400).json({
      success: false,
      error: "Incomplete match state received."
    });
  }

  try {
    const rawState = req.body;
    const matchState = validateMatchState(rawState);
    
    // Execute orchestrator using the main runCaptainCool function
    const result = await runCaptainCool(matchState);
    
    res.json({
      success: true,
      transcript: result.transcript,
      commentary: result.agents.commentator,
      data: result
    });
  } catch (error) {
    console.error("API error while generating strategy via /analyze:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Get all preset scenarios
 */
app.get('/api/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: Object.values(PRESET_SCENARIOS).map(s => {
      const state = new IPLMatchState(s);
      return {
        ...s,
        ...state
      };
    })
  });
});

/**
 * API: Analyze match state using multi-agent strategy system (Dashboard Backward Compatibility)
 */
app.post('/api/strategy', async (req, res) => {
  console.log("📥 Received POST /api/strategy match state payload:");
  console.log(JSON.stringify(req.body, null, 2));

  // Input validation check (STEP 7)
  if (!req.body || req.body.striker === undefined || req.body.over === undefined) {
    console.error("❌ Validation Failed: Incomplete match state received.");
    return res.status(400).json({
      success: false,
      error: "Incomplete match state received."
    });
  }

  try {
    const rawState = req.body;
    
    // Quick validation
    const matchState = validateMatchState(rawState);
    
    // Execute orchestrator
    const result = await runStrategySystem(matchState);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("API error while generating strategy:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export app for Vercel serverless
export default app;

// Start the Express Server
app.listen(PORT, () => {
  console.log("======================================================================");
  console.log(" 🏏 UNDERCOVER CAPTAIN: MULTI-AGENT IPL CRICKET STRATEGY ENGINE");
  console.log("======================================================================");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Visual Dashboard:  http://localhost:${PORT}/index.html`);
  console.log("----------------------------------------------------------------------");
  if (!process.env.GEMINI_API_KEY) {
    console.log("⚠️  Note: GEMINI_API_KEY not found in environment.");
    console.log("   The system will automatically run in high-fidelity LOCAL DEMO MODE.");
    console.log("   Create a .env file and add your key to enable the live Gemini-2.5-Flash model!");
  } else {
    console.log("⚡ Gemini API connection configured successfully.");
  }
  console.log("======================================================================");
});
