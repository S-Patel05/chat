import User from "../models/User.js";
import bcrypt from "bcryptjs";


export const signup = async (req, res) =>{
    const { fullName, email, password } = req.body;

    try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if emailis valid: regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // 123456 => $dnjasdkasj_?dmsakmk
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

     const savedUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    // 5️⃣ Send SUCCESS response immediately ✅
    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      profilePic: savedUser.profilePic,
    });

    // 6️⃣ Side-effects (DO NOT block signup)
    try {
      generateToken(savedUser._id, res);
      await sendWelcomeEmail(
        savedUser.email,
        savedUser.fullName,
        process.env.CLIENT_URL
      );
    } catch (sideEffectError) {
      console.error("Post-signup task failed:", sideEffectError.message);
    }

  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};