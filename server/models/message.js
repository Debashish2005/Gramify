const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    default: "",
    trim: true,
  },
  messageType: {
    type: String,
    enum: ["text", "shared_post"],
    default: "text",
  },
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
