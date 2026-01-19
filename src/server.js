import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Connect DB
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
