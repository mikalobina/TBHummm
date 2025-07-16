import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  toUser: String,
  text: String,
  ip: String,
  location: String,
  device: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
