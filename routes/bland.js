//Handles voice session management
const express = require("express");
const router = express.Router();
const blandService = require("../services/blandService");

// Starts a new web-based voice trading session
router.post("/start-call", async (req, res) => {
  try {
    const callData = await blandService.startCall();
    res.json(callData);
  } catch (error) {
    console.error("Error starting voice session:", error);
    res.status(500).json({ error: "Failed to start voice session" });
  }
});

// Ends an active voice trading session
router.post("/stop-call/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    await blandService.stopCall(callId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error stopping voice session:", error);
    res.status(500).json({ error: "Failed to stop voice session" });
  }
});

// Gets current status of a voice trading session
router.get("/call-status/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    const status = await blandService.getCallStatus(callId);
    res.json(status);
  } catch (error) {
    console.error("Error getting session status:", error);
    res.status(500).json({ error: "Failed to get session status" });
  }
});

// Receives webhook updates from Bland.ai during conversations
router.post("/webhook", (req, res) => {
  try {
    const data = req.body;
    console.log("Received conversation update:", data);

    // Process the conversation data to extract trading information
    blandService.handleWebhook(data);

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing conversation update:", error);
    res.status(500).json({ error: "Failed to process conversation update" });
  }
});

module.exports = router;
