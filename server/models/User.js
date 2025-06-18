const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  dp: {
    type: String, // store image filename or full URL
    default: "",  // default to blank or a default image URL
  },
  bio: {
    type: String,
    default: "",
    maxlength: 150,
  },
  website: {
    type: String,
    default: "",
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  notifications: [
  {
    type: {
      type: String, // e.g. 'like', 'comment', 'follow'
    },
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // optional
  },
],
messages: [
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
],
followRequests: [
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    createdAt: { type: Date, default: Date.now }
  }
],
sentFollowRequests: [
  {
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    createdAt: { type: Date, default: Date.now }
  }
],

resetToken:  {
    type: String,
    default: "",
  },
resetTokenExpiry:  {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,

});

module.exports = mongoose.model("User", UserSchema);
