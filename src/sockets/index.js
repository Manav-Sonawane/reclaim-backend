import { Server } from "socket.io";
import Message from "../models/message.js";

export const initSocket = (server) => {
  // Parse CORS origins (supports multiple comma-separated origins)
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ["http://localhost:3000"];

  const io = new Server(server, {
    cors: {
      origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("send_message", async (data) => {
      try {
        const message = new Message({
          roomId: data.roomId,
          sender: data.sender,
          text: data.text,
        });
        await message.save();
        io.to(data.roomId).emit("receive_message", data);
      } catch (err) {
        console.error("Message save error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
