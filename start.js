const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

// Check if tunnel is requested
const useTunnel = process.argv.includes("--tunnel");

// Start Python service
console.log("Starting Python exchange service...");
const pythonProcess = spawn(
  "python",
  [path.join(__dirname, "python_service/exchange_service.py")],
  {
    stdio: "inherit",
  }
);

pythonProcess.on("error", (err) => {
  console.error("Failed to start Python service:", err);
  console.log("Make sure Python is installed and requirements are met.");
  console.log("Continuing with Node.js service only...");
});

// Start Node.js service
console.log("Starting Node.js server...");
const nodeProcess = spawn("node", ["server.js"], {
  stdio: "inherit",
});

// Start tunnel if requested
if (useTunnel) {
  console.log("Starting localtunnel...");
  const tunnelProcess = spawn("node", ["tunnel.js"], {
    stdio: "inherit",
  });

  tunnelProcess.on("error", (err) => {
    console.error("Failed to start tunnel:", err);
    console.log("Continuing without tunnel...");
  });
}

nodeProcess.on("error", (err) => {
  console.error("Failed to start Node.js server:", err);
  process.exit(1);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down services...");
  pythonProcess.kill();
  nodeProcess.kill();
  process.exit(0);
});
