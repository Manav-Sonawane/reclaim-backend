import { Server } from "socket.io";
import Message from "../models/message.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("send_message", async (data) => {
      const message = new Message({
        roomId: data.roomId,
        sender: data.sender,
        text: data.text,
      });
      await message.save();
      io.to(data.roomId).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
