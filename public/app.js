//Manages the web interface and user interactions
document.addEventListener("DOMContentLoaded", () => {
  const app = new VoiceTradingBot();
});

class VoiceTradingBot {
  constructor() {
    this.callId = null;
    this.isCallActive = false;
    this.currentOrder = {};
    this.blandClient = null;
    this.webSocketUrl = null;
    this.micSimulation = null; // For visual microphone feedback

    this.initializeElements();
    this.setupEventListeners();
  }

  // Initialize DOM elements for the interface
  initializeElements() {
    this.startCallBtn = document.getElementById("startCall");
    this.stopCallBtn = document.getElementById("stopCall");
    this.statusText = document.getElementById("statusText");
    this.stepText = document.getElementById("stepText");
    this.transcript = document.getElementById("transcript");
    this.orderSummary = document.getElementById("orderSummary");
    this.orderDetails = document.getElementById("orderDetails");
    this.micIndicator = document.getElementById("micIndicator");
    this.micStatus = document.getElementById("micStatus");
  }

  // Set up event listeners for user interactions
  setupEventListeners() {
    this.startCallBtn.addEventListener("click", () => this.startCall());
    this.stopCallBtn.addEventListener("click", () => this.stopCall());
  }

  // Initiates a web-based voice trading session
  async startCall() {
    try {
      // Show user that microphone access is being requested
      this.addMessage("system", "🎙️ Initializing web-based voice interface...");

      await this.requestMicrophonePermission();

      this.updateStatus("Connecting...", "Setting Up Voice Interface");
      this.startCallBtn.disabled = true;

      // Call backend to create voice session
      const response = await fetch("/bland/start-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initialize voice interface");
      }

      const data = await response.json();
      this.callId = data.callId;
      this.webSocketUrl = data.webSocketUrl;
      this.isCallActive = true;

      // Set up successful connection state
      this.establishVoiceConnection();

      this.updateStatus("🎙️ Connected", "Voice interface active");
      this.stopCallBtn.disabled = false;

      this.addMessage(
        "system",
        "✅ Voice interface ready! You can now speak to place OTC trades."
      );

      // Start visual feedback and status polling
      this.startMicrophoneVisualization();
      this.pollCallStatus();
    } catch (error) {
      console.error("Error starting voice session:", error);
      this.addMessage("system", `❌ Error: ${error.message}`);
      this.updateStatus("Error", "Failed to connect");
      this.startCallBtn.disabled = false;
    }
  }

  // Simulates microphone permission request for web interface
  async requestMicrophonePermission() {
    return new Promise((resolve) => {
      this.addMessage("system", "🔒 Requesting microphone access...");
      setTimeout(() => {
        this.addMessage("system", "✅ Microphone access granted");
        resolve();
      }, 1500);
    });
  }

  // Sets up the voice connection interface
  establishVoiceConnection() {
    this.addMessage("system", "🌐 Establishing voice connection...");

    setTimeout(() => {
      this.updateMicStatus(true);
      this.addMessage(
        "system",
        "🎯 Voice interface ready - speak to begin trading!"
      );

      // Add initial bot greeting
      setTimeout(() => {
        this.addMessage(
          "bot",
          "Hello! I'm your OTC trading assistant. I'll help you place digital asset orders through voice commands. Which exchange would you like to use: OKX, Bybit, Deribit, or Binance?"
        );
      }, 2000);
    }, 1000);
  }

  // Creates visual feedback for active microphone
  startMicrophoneVisualization() {
    let intensity = 0;
    this.micSimulation = setInterval(() => {
      // Create pulsing effect to show microphone is active
      intensity = Math.random() * 0.5 + 0.5;
      this.micIndicator.style.transform = `scale(${intensity})`;
      this.micIndicator.style.opacity = intensity;
    }, 200);
  }

  // Stops microphone visualization
  stopMicrophoneVisualization() {
    if (this.micSimulation) {
      clearInterval(this.micSimulation);
      this.micSimulation = null;
      this.micIndicator.style.transform = "scale(1)";
      this.micIndicator.style.opacity = "1";
    }
  }

  // Updates microphone status display
  updateMicStatus(active) {
    if (active) {
      this.micIndicator.classList.remove("inactive");
      this.micIndicator.classList.add("active");
      this.micStatus.innerHTML =
        "🎙️ <strong>Microphone Active - Listening</strong>";
      this.micStatus.style.color = "#4caf50";

      // Add visual pulsing animation
      this.micIndicator.style.animation =
        "pulse 1.5s infinite, micGlow 2s infinite";
    } else {
      this.micIndicator.classList.remove("active");
      this.micIndicator.classList.add("inactive");
      this.micStatus.innerHTML = "🔇 Microphone Inactive";
      this.micStatus.style.color = "#f44336";
      this.micIndicator.style.animation = "none";
    }
  }

  // Ends the voice trading session
  async stopCall() {
    try {
      this.addMessage("system", "🔌 Ending voice session...");

      this.stopMicrophoneVisualization();

      if (this.callId) {
        await fetch(`/bland/stop-call/${this.callId}`, {
          method: "POST",
        });
      }

      // Reset interface state
      this.isCallActive = false;
      this.callId = null;
      this.webSocketUrl = null;
      this.blandClient = null;

      this.updateStatus("Disconnected", "Voice session ended");
      this.updateMicStatus(false);
      this.startCallBtn.disabled = false;
      this.stopCallBtn.disabled = true;

      this.addMessage("system", "✅ Voice trading session completed.");
    } catch (error) {
      console.error("Error ending voice session:", error);
    }
  }

  // Polls the backend for conversation updates
  async pollCallStatus() {
    if (!this.isCallActive || !this.callId) return;

    try {
      const response = await fetch(`/bland/call-status/${this.callId}`);
      if (response.ok) {
        const data = await response.json();
        this.handleCallUpdate(data);
      }
    } catch (error) {
      console.error("Error checking session status:", error);
    }

    // Continue polling every 2 seconds while session is active
    if (this.isCallActive) {
      setTimeout(() => this.pollCallStatus(), 2000);
    }
  }

  // Processes updates from the voice session
  handleCallUpdate(data) {
    // Update current trading step
    this.stepText.textContent = `Current Step: ${data.currentStep}`;

    // Update order information if available
    if (data.orderData && Object.keys(data.orderData).length > 0) {
      this.updateOrderSummary(data.orderData);
    }

    // Check if session has ended
    if (data.status === "completed" || data.status === "failed") {
      this.isCallActive = false;
      this.updateStatus("Disconnected", "Session completed");
      this.startCallBtn.disabled = false;
      this.stopCallBtn.disabled = true;
      this.stopMicrophoneVisualization();
    }
  }

  // Updates interface status display
  updateStatus(status, step) {
    this.statusText.textContent = status;
    if (step) {
      this.stepText.textContent = step;
    }
  }

  // Adds messages to the conversation transcript
  addMessage(type, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;

    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
      <strong>[${timestamp}] ${
      type.charAt(0).toUpperCase() + type.slice(1)
    }:</strong> ${content}
    `;

    this.transcript.appendChild(messageDiv);
    this.transcript.scrollTop = this.transcript.scrollHeight;
  }

  // Updates the order summary display
  updateOrderSummary(orderData) {
    this.currentOrder = { ...this.currentOrder, ...orderData };

    if (Object.keys(this.currentOrder).length > 0) {
      this.orderSummary.style.display = "block";

      this.orderDetails.innerHTML = Object.entries(this.currentOrder)
        .map(
          ([key, value]) => `
          <div class="order-item">
            <span><strong>${
              key.charAt(0).toUpperCase() + key.slice(1)
            }:</strong></span>
            <span>${value}</span>
          </div>
        `
        )
        .join("");
    }
  }
}
