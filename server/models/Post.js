const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    caption: { type: String, trim: true, maxlength: 1000 },

    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true }
      }
    ],

    // Reaction types: like, love, smile, sad, angry
    reactions: {
      like: [{ type: Schema.Types.ObjectId, ref: "User" }],
      love: [{ type: Schema.Types.ObjectId, ref: "User" }],
      smile: [{ type: Schema.Types.ObjectId, ref: "User" }],
      sad: [{ type: Schema.Types.ObjectId, ref: "User" }],
      angry: [{ type: Schema.Types.ObjectId, ref: "User" }]
    },

    comments: [commentSchema],

    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public"
    },

    tags: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
