//Central server that coordinates all components
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

// handles cors and Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Import routes
const apiRoutes = require("./routes/api");
const blandRoutes = require("./routes/bland");

// Routes API requests
app.use("/api", apiRoutes);
app.use("/bland", blandRoutes);

// Serve the web interface
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
});
