import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/index.js";

import { Server } from "socket.io";
import Chat from "./models/chat.js";

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);


connectDB();
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
