import http from "http";
import app from "./app.js";
// import { initSocket } from "./scokets/index.js";

const server = http.createServer(app);

// initSocket(server);

server.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
