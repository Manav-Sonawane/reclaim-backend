import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../utils/email.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Send Welcome Email
    await sendEmail({
      to: user.email,
      subject: "Welcome to Reclaim!",
      text: `Hi ${user.name},\n\nWelcome to Reclaim! We're glad to have you.\n\nStart reporting lost or found items today.\n\nBest,\nReclaim Team`,
      html: `<p>Hi <strong>${user.name}</strong>,</p><p>Welcome to Reclaim! We're glad to have you.</p><p>Start reporting lost or found items today.</p><p>Best,<br>Reclaim Team</p>`
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USER BY ID (Public Profile)
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("name email profilePicture role createdAt");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GOOGLE OAUTH LOGIN
export const googleAuth = async (req, res) => {
  try {
    console.log("=== Google Auth Debug ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Content-Type:", req.headers['content-type']);

    const { token, credential, idToken } = req.body;

    // Accept token from multiple field names for flexibility
    const googleToken = token || credential || idToken;

    if (!googleToken) {
      console.log("❌ Token missing from request");
      console.log("Received fields:", Object.keys(req.body));
      return res.status(400).json({
        message: "Google token required. Expected field: 'token', 'credential', or 'idToken'",
        receivedFields: Object.keys(req.body),
        hint: "Make sure you're sending the Google ID token in the request body"
      });
    }

    console.log("✓ Token received, verifying with Google...");

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log("✓ Token verified for user:", email);

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // New User Logic
      // If a custom name is NOT provided in the request, ask frontend to get it
      const { name: customName } = req.body;

      if (!customName) {
        return res.status(200).json({
          requiresSignup: true,
          googleProfile: {
            email,
            name, // Google's default name
            picture
          }
        });
      }

      // Create new user with custom name
      user = await User.create({
        name: customName, // Use the name provided by user
        email,
        googleId,
        profilePicture: picture,
      });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Google authentication failed" });
  }
};
// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.profilePicture = req.body.profilePicture || user.profilePicture;

      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
