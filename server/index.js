const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/User");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const Post = require("./models/Post");
const crypto = require("crypto");
const transporter = require("./utils/mailer");
const http = require("http"); 
const { Server } = require("socket.io"); 
const Conversation = require("./models/conversation");
const Message = require("./models/message");

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Router instance
const router = express.Router();

// Cloudinary setup
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "gramify/posts",
      resource_type: isVideo ? "video" : "image",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});
const upload = multer({ storage });

// Logging email status


// JWT + MongoDB connection
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auth middleware
function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

// ✅ WebSocket logic
const users = {}; // optional, but we'll still use it for debugging

io.on("connection", (socket) => {
  console.log("⚡ New socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId); // ✅ join a room named by userId
    users[userId] = socket.id;
    console.log(`🟢 User ${userId} joined with socket ${socket.id}`);
  });

  socket.on("send-message", async ({ from, to, content, conversationId }) => {
    const message = await Message.create({ from, to, content, conversationId });

    // ✅ Emit to the userId room instead of socket ID
    io.to(to).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
    // Optionally: remove user from map (advanced)
  });
});






app.post("/signup", async (req, res) => {
  const { email, password, name, username } = req.body;

  try {
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: "User already exists with this email/username" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new UserModel({
      email,
      password: hashedPassword,
      name,
      username,
    });

    await newUser.save();
    res.status(201).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post('/login', async (req, res) => {
  const { loginInput, password } = req.body;

  try {
    // Find user by email or username
    const user = await UserModel.findOne({
      $or: [{ email: loginInput }, { username: loginInput }]
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // only over HTTPS
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
});
res.status(200).json({ message: "Login successful" });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(200).json({ message: "If that email exists, a reset link was sent." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 15 * 60 * 1000; // 15 mins

  user.resetToken = resetToken;
  user.resetTokenExpiry = expiry;
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  await transporter.sendMail({
    from: `Gramify <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `<p>Click below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>This link will expire in 15 minutes.</p>`
  });

  res.status(200).json({ message: "Reset link sent to email." });
});

app.post("/reset-password", async (req, res) => {
  const { email, token, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user || user.resetToken !== token || Date.now() > user.resetTokenExpiry) {
    return res.status(400).json({ message: "Invalid or expired reset link." });
  }

  user.password = await bcrypt.hash(password, 10); // hash new password
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: "Password successfully reset." });
});


app.get("/me", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .select("-password")
      .populate("notifications.from", "username dp")
      .populate("messages.from", "username dp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const unreadNotifications = user.notifications
      ? user.notifications.filter(n => !n.isRead).length
      : 0;

    const unreadMessages = user.messages
      ? user.messages.filter(m => !m.isRead).length
      : 0;

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        dp: user.dp,
        bio: user.bio,
        website: user.website,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        createdAt: user.createdAt,
      },
      unreadNotifications,
      unreadMessages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/post", auth, upload.array("media", 7), async (req, res) => {
  try {
    const { caption, visibility, tags } = req.body;

    const media = req.files.map((file) => ({
      url: file.path, // Cloudinary URL
      type: file.mimetype.startsWith("video") ? "video" : "image",
    }));

    const newPost = new Post({
      user: req.user.id,
      caption,
      visibility,
      tags: tags.split(",").map((t) => t.trim()),
      media,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});
app.patch("/post/:id", auth, upload.array("media", 7), async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { caption, visibility, tags } = req.body;

    // Prepare update object
    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags
      .split(",")
      .map((tag) => tag.trim());

    // TODO: Handle new media upload if any (currently optional)
    if (req.files && req.files.length > 0) {
      // Optional: if you're using Cloudinary or local disk, upload the media files
      // Then structure them like: [{ url: "some-url",type: "image/video" }, ...]
      const uploadedMedia = req.files.map((file) => ({
        url: file.path, // Upload and get the URL
        type: file.mimetype.startsWith("video") ? "video" : "image",
      }));

      updateData.media = uploadedMedia;
    }

    // Find and update post if owned by the user
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, user: userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("❌ Failed to update post:", err);
    res.status(500).json({ error: "Something went wrong while editing the post" });
  }
});

app.get("/feed", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Use the correct model name
    const user = await UserModel.findById(userId).select("following");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followingIds = user.following.map((id) => id.toString());

    // ✅ Get posts based on visibility
    const posts = await Post.find({
      $or: [
        { user: userId },
        { visibility: "public" },
        {
          visibility: "friends",
          user: { $in: followingIds },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("user", "username dp")
      .populate("comments.user", "username dp")
      .limit(50);

  const formattedPosts = posts.map((post) => {
  const userReaction = Object.entries(post.reactions || {}).find(
    ([type, users]) => users.some((uid) => uid.toString() === userId)
  )?.[0]; // Get the type of reaction

  return {
    _id: post._id,
    user: post.user,
    caption: post.caption,
    media: post.media,
    createdAt: post.createdAt,
    visibility: post.visibility,
    tags: post.tags,
    reactions: {
      like: post.reactions?.like?.length || 0,
      love: post.reactions?.love?.length || 0,
      smile: post.reactions?.smile?.length || 0,
      sad: post.reactions?.sad?.length || 0,
      angry: post.reactions?.angry?.length || 0,
    },
    userReaction: userReaction || null, // ✅ Include this
    comments: post.comments.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      user: c.user,
    })),
  };
});


    res.status(200).json({ feed: formattedPosts });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ error: "Failed to load feed" });
  }
});


app.post("/feed/:postId/react", auth, async (req, res) => {
  const { type } = req.body;
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // Ensure reactions object exists
  const types = ["like", "love", "smile", "sad", "angry"];
  types.forEach((t) => {
    post.reactions[t] = post.reactions[t] || [];
    post.reactions[t] = post.reactions[t].filter(
      (uid) => uid.toString() !== userId
    );
  });

  post.reactions[type] = [...(post.reactions[type] || []), userId];
  await post.save();

  res.json({ reactions: post.reactions });
});

app.post("/feed/:postId/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;
    const postId = req.params.postId;

    // Build the comment object
    const comment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    // Push the comment into the post's comments array
    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment } },
      { new: true }
    ).populate("comments.user", "username dp");

    const newComment = post.comments[post.comments.length - 1]; // last one is the newly added

    res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});
 
app.put("/update-profile", auth, upload.single("dp"), async (req, res) => {
  try {
    const { username, bio } = req.body;
    const userId = req.user.id;

    // Check if new username is already taken by another user
    const existingUser = await UserModel.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const updateData = { username, bio };

    // If DP image uploaded, upload to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pictures",
      });
      updateData.dp = result.secure_url; // ✅ Save to dp, not profilePic
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/my-posts", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "username dp")
      .populate("comments.user", "username dp");

    const formattedPosts = posts.map((post) => {
      const userReaction = Object.entries(post.reactions || {}).find(
        ([type, users]) => users.some((uid) => uid.toString() === userId)
      )?.[0];

      return {
        _id: post._id,
        user: post.user,
        caption: post.caption,
        media: post.media,
        createdAt: post.createdAt,
        visibility: post.visibility,
        tags: post.tags,
        reactions: {
          like: post.reactions?.like?.length || 0,
          love: post.reactions?.love?.length || 0,
          smile: post.reactions?.smile?.length || 0,
          sad: post.reactions?.sad?.length || 0,
          angry: post.reactions?.angry?.length || 0,
        },
        userReaction: userReaction || null,
        comments: post.comments.map((c) => ({
          _id: c._id,
          text: c.text,
          createdAt: c.createdAt,
          user: c.user,
        })),
      };
    });

    res.json({ posts: formattedPosts });
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// GET /check-username?username=desiredName
app.get("/check-username", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const existingUser = await UserModel.findOne({ username: username.trim() });

    if (existingUser) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (err) {
    console.error("Username check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/post/:id", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id; // Assuming `verifyToken` attaches user info

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Optional: check if user owns the post
    if (post.user.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true, // only if using HTTPS
    sameSite: "Strict", // or "Lax" depending on your needs
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Example for Express.js
app.get("/profile/:username",auth, async (req, res) => {
  try {
    const { username } = req.params;

    // 1. Find the profile being visited
    const user = await UserModel.findOne({ username }).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Get current logged-in user
    const currentUser = await UserModel.findById(req.user.id).lean(); // assumes auth middleware sets req.user

    // 3. Check following status
    const isFollowing = user.followers.some(
      (followerId) => followerId.toString() === currentUser._id.toString()
    );

    const hasRequested = user.followRequests?.some(
      (r) => r.toString() === currentUser._id.toString()
    );

    const followStatus = isFollowing
      ? "following"
      : hasRequested
      ? "requested"
      : "none";

    // 4. Only send posts if user is current or following
    const canSeePosts =
      user._id.toString() === currentUser._id.toString() || isFollowing;

    const posts = canSeePosts
      ? await Post.find({ user: user._id }).sort({ createdAt: -1 })
      : [];

    res.json({
      user: {
        ...user,
        followStatus,
      },
      posts,
    });
  } catch (err) {
    console.error("Error in /profile/:username", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/user-posts/:username", auth, async (req, res) => {
  try {
    const { username } = req.params;
    const profileUser = await UserModel.findOne({ username }).select("username dp bio name followers following");

    if (!profileUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = await UserModel.findById(req.user.id);

    const isFollowing = profileUser.followers.includes(currentUser._id);
    
    // ✅ Always get post count first
    const postCount = await Post.countDocuments({ user: profileUser._id });

    if (!isFollowing && profileUser._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        error: "Not authorized to view posts",
        postCount, // ✅ still return post count
      });
    }

    const posts = await Post.find({ user: profileUser._id })
      .sort({ createdAt: -1 })
      .populate("user", "username dp")
      .populate("comments.user", "username dp");

    const formattedPosts = posts.map((post) => {
      const userReaction = Object.entries(post.reactions || {}).find(
        ([type, users]) => users.some((uid) => uid.toString() === currentUser._id.toString())
      )?.[0];

      return {
        _id: post._id,
        user: post.user,
        caption: post.caption,
        media: post.media,
        createdAt: post.createdAt,
        visibility: post.visibility,
        tags: post.tags,
        reactions: {
          like: post.reactions?.like?.length || 0,
          love: post.reactions?.love?.length || 0,
          smile: post.reactions?.smile?.length || 0,
          sad: post.reactions?.sad?.length || 0,
          angry: post.reactions?.angry?.length || 0,
        },
        userReaction: userReaction || null,
        comments: post.comments.map((c) => ({
          _id: c._id,
          text: c.text,
          createdAt: c.createdAt,
          user: c.user,
        })),
      };
    });

    res.json({
      user: {
        _id: profileUser._id,
        username: profileUser.username,
        name: profileUser.name,
        dp: profileUser.dp,
        bio: profileUser.bio,
        followersCount: profileUser.followers.length,
        followingCount: profileUser.following.length,
      },
      posts: formattedPosts,
      postCount, // ✅ added here too
    });
  } catch (err) {
    console.error("Error fetching profile user posts:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Send follow request
app.post("/follow-request/:userId",auth, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    if (fromUserId === toUserId) return res.status(400).json({ error: "You can't follow yourself" });

    const fromUser = await UserModel.findById(fromUserId);
    const toUser = await UserModel.findById(toUserId);

    // Check if already following
    if (toUser.followers.includes(fromUserId)) {
      return res.status(400).json({ error: "Already following" });
    }

    // Check if already requested
    const alreadyRequested = toUser.followRequests.some(
      (req) => req.from.toString() === fromUserId && req.status === "pending"
    );
    if (alreadyRequested) {
      return res.status(400).json({ error: "Follow request already sent" });
    }

    // Add follow request to target user
    toUser.followRequests.push({ from: fromUserId });
    await toUser.save();

    // Add to sender’s sentFollowRequests
    fromUser.sentFollowRequests.push({ to: toUserId });
    await fromUser.save();

    res.json({ message: "Follow request sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Assuming req.user._id is the current user's ID
app.get("/follow-status/:targetId", auth,async (req, res) => {
  const currentUserId = req.user.id;
  const targetId = req.params.targetId;

  try {
 const targetUser = await UserModel.findOne({ targetId }).lean();

if (!targetUser) {
  return res.status(404).json({ error: "User not found" });
}

// Check if current user is already a follower
if (targetUser.followers.includes(currentUserId)) {
  return res.json({ status: "following" });
}

// Check if there is a pending follow request from current user
const hasRequested = targetUser.followRequests.some(
  (req) => req.from.toString() === currentUserId && req.status === "pending"
);

if (hasRequested) {
  return res.json({ status: "requested" });
}

// Default: not following
return res.json({ status: "not_following" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// GET /notifications
app.get("/notifications",auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).populate("followRequests.from", "username name dp");
console.log("User ID:", req.user.id);
console.log("Follow Requests:", user.followRequests);

    const pendingRequests = user.followRequests.filter(req => req.status === "pending");

    res.json({ requests: pendingRequests });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// Accept follow request
// PUT /follow-request/:fromUserId/accept
app.put("/follow-request/:fromUserId/accept", auth, async (req, res) => {
  try {
    const toUser = await UserModel.findById(req.user.id);
    const fromUser = await UserModel.findById(req.params.fromUserId);

    const request = toUser.followRequests.find(
      (r) => r.from.toString() === req.params.fromUserId && r.status === "pending"
    );

    if (!request) return res.status(404).json({ error: "Request not found" });

    // Mark as accepted
    request.status = "accepted";

    // Remove request from toUser.followRequests
    toUser.followRequests = toUser.followRequests.filter(
      (r) => r.from.toString() !== req.params.fromUserId
    );

    // Avoid duplicates
    if (!toUser.followers.includes(fromUser._id)) {
      toUser.followers.push(fromUser._id);
    }
    if (!fromUser.following.includes(toUser._id)) {
      fromUser.following.push(toUser._id);
    }

    // Remove from sender’s sentFollowRequests
    fromUser.sentFollowRequests = fromUser.sentFollowRequests.filter(
      (r) => r.to.toString() !== req.user.id
    );

    await toUser.save();
    await fromUser.save();

    res.json({ message: "Follow request accepted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
    console.log(err);
  }
});


// PUT /follow-request/:fromUserId/reject
app.put("/follow-request/:fromUserId/reject", auth, async (req, res) => {
  try {
    const toUser = await UserModel.findById(req.user.id);

    // Filter out the rejected follow request
    toUser.followRequests = toUser.followRequests.filter(
      (r) => r.from.toString() !== req.params.fromUserId || r.status !== "pending"
    );

    await toUser.save();

    res.json({ message: "Follow request rejected and removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/search-users", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.json({ users: [] });

    const users = await UserModel.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } }
      ]
    })
    .select("username name dp") // only return needed fields
    .limit(10);

    res.json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/unfollow/:userId", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "You can't unfollow yourself" });
    }

    // Remove targetUser from current user's following list
    await UserModel.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId }
    });

    // Remove current user from targetUser's followers list
    await UserModel.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId }
    });

    // Optional: clean up notifications, followRequests, etc.

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /conversations/:userId
app.get("/conversations/:userId",auth, async (req, res) => {
  const currentUserId = req.user.id; // From auth middleware
  const otherUserId = req.params.userId;

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error("Conversation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /messages/:conversationId
app.get("/messages/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // 👈 Add this

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${userId}`]: 0 }
    });

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// POST /messages
app.post("/messages", async (req, res) => {
  try {
    const { conversationId, from, to, content } = req.body;

    // 1. Create the message
    const message = await Message.create({
      conversationId,
      from,
      to,
      content,
    });

    // 2. Update the conversation's lastMessage field
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      $inc: { [`unreadCounts.${to}`]: 1 }
    });

    // 3. Emit to recipient via socket
    io.to(to).emit("receive-message", message);

    // 4. Respond with the message
    res.json(message);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// GET /conversations
app.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.id;

const conversations = await Conversation.find({
  participants: userId,
})
  .populate({
    path: "lastMessage",
    select: "content createdAt", // also fetch createdAt
  })
  .populate({
    path: "participants",
    select: "username dp",
  })
  .sort({ "lastMessage.createdAt": -1 }); // sort by latest message

    // Transform the response to your expected structure
    const result = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        userId: otherUser._id,
        name: otherUser.username,
        dp: otherUser.dp,
        lastMessage: conv.lastMessage?.content || "No messages yet",
        lastMessageTime: conv.lastMessage?.createdAt || null,
        unreadCount: conv.unreadCounts?.get?.(userId.toString()) || 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Server error" });
  }
});




server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
