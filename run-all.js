const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

// Start tunnel first to get the URL
console.log("Starting localtunnel...");
const tunnelProcess = spawn("node", ["tunnel.js"], {
  stdio: "inherit",
});

// Wait a bit for the tunnel to establish
setTimeout(() => {
  // Start Python service
  console.log("Starting Python exchange service...");
  const pythonProcess = spawn(
    "python",
    [path.join(__dirname, "python_service/exchange_service.py")],
    {
      stdio: "inherit",
    }
  );

  // Start Node.js service
  console.log("Starting Node.js server...");
  const nodeProcess = spawn("node", ["server.js"], {
    stdio: "inherit",
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Shutting down all services...");
    tunnelProcess.kill();
    pythonProcess.kill();
    nodeProcess.kill();
    process.exit(0);
  });
}, 5000); // Wait 5 seconds for tunnel to establish
