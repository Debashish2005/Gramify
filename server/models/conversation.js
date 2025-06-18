const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  unreadCounts: {
  type: Map, // { userId: count }
  of: Number,
  default: {},
},

}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
