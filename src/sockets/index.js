import { Server } from "socket.io";
import Chat from "../models/chat.js";

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
        // Find the chat
        const chat = await Chat.findById(data.chatId);
        if (!chat) {
             console.error("Chat not found for roomId:", data.chatId);
             return;
        }

        const newMessage = {
            sender: data.senderId,
            content: data.text,
            timestamp: new Date(),
            read: false
        };

        // Add to chat messages array
        chat.messages.push(newMessage);
        await chat.save();
        
        // Emit back to room with keys matching frontend expectation
        io.to(data.chatId).emit("receive_message", {
            sender: data.senderId,
            text: data.text,
            timestamp: newMessage.timestamp
        });

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
