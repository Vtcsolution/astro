const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Payment = require('../models/Payment');
const NumerologyReport = require('../models/NumerologyReport');
const { generateNumerologyReport, createNarrativeReport } = require('./numerologyController');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, dob, birthTime, birthPlace, image } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirmPassword || !dob) {
      return res.status(400).json({ message: 'Username, email, password, confirm password, and date of birth are required' });
    }

    // Validate password matching
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate DOB format (YYYY-MM-DD)
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      return res.status(400).json({ message: 'Date of birth must be in YYYY-MM-DD format' });
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth' });
    }

    // Ensure DOB is not in the future
    const today = new Date();
    if (dobDate > today) {
      return res.status(400).json({ message: 'Date of birth cannot be in the future' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nameParts = username.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      dob: dobDate,
      birthTime,
      birthPlace,
      image,
      hasRequestedFreeReport: true,
    });

    // Generate numerology report
    const numerologyData = await generateNumerologyReport(firstName, lastName, dob);
    const narrative = await createNarrativeReport(numerologyData, firstName);

    // Save numerology report to database
    const numerologyReport = new NumerologyReport({
      userId: newUser._id,
      numbers: {
        lifepath: numerologyData.lifepath,
        expression: numerologyData.expression,
        soulurge: numerologyData.soulurge,
        personality: numerologyData.personality,
      },
      narrative,
    });
    await numerologyReport.save();

    const token = generateToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        dob: newUser.dob.toISOString().split('T')[0],
        birthTime: newUser.birthTime,
        birthPlace: newUser.birthPlace,
        image: newUser.image,
      },
      numerologyData: {
        numbers: {
          lifepath: numerologyData.lifepath,
          expression: numerologyData.expression,
          soulurge: numerologyData.soulurge,
          personality: numerologyData.personality,
        },
        narrative,
        source: numerologyData.source || 'API',
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateToken(user._id);
    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("username email image bio dob totalTime totalPayment createdAt");
    
    const usersWithCredits = await Promise.all(users.map(async (user) => {
      let wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) {
        wallet = await Wallet.create({
          userId: user._id,
          balance: 0,
          credits: 0
        });
        console.log(`Created wallet for user ${user._id}`);
      }
      return {
        ...user.toObject(),
        credits: wallet.credits
      };
    }));

    console.log('Users with credits:', usersWithCredits);
    res.status(200).json({ 
      success: true, 
      users: usersWithCredits 
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getUserByAdmin = async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await Wallet.findOne({ userId });
    const payments = await Payment.find({ userId }).select('amount planName creditsPurchased paymentMethod molliePaymentId status creditsAdded createdAt');

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        credits: wallet ? wallet.credits : 0,
        payments: payments.map(payment => ({
          amount: payment.amount,
          planName: payment.planName,
          creditsPurchased: payment.creditsPurchased,
          paymentMethod: payment.paymentMethod,
          molliePaymentId: payment.molliePaymentId,
          status: payment.status,
          creditsAdded: payment.creditsAdded,
          createdAt: payment.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user details by admin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const deleteUserById = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", deletedUser });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

///forget password 
const forgetPassword = async (req, res) => {
    try{
    const {email} = req.body;
     const user= await User.findOne({email});
     if (!user){
        return res.status (400).json ({message: 'User not found'});
     }
         // Generate secure random token
         const token = crypto.randomBytes(32).toString('hex');
         user.resetPasswordToken = token;
         user.resetPasswordExpires = Date.now() +360000; 
         await user.save();

         ///reset password link
         const resetLink = `http://localhost:5000/api/users/reset-password/${token}`;
         // Send email with reset link (implementation not shown)
         res.status(200).json({message: 'Reset password link sent', resetLink});
    }catch (error) {
        console.error(error);
        res.status(500).json({message: 'Internal server error'});
    }
}

const resetPassword = async (req, res) => {
    try{
        const token = req.params.token;
        const {newPassword} = req.body;
        const user = await User.findOne ({
            resetPasswordToken: token,
            resetPasswordExpires: {$gt: Date.now()}
        })
        if (!user) {
            return res.status(400).json({message: 'Invalid or expired token'});
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({message: 'Password reset successful'});
    }catch (error) {
        console.error(error);
        res.status(500).json({message: 'Internal server error'});
    }
}

const fetchUserById = async (req, res) => {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await Wallet.findOne({ userId });
    const payments = await Payment.find({ userId }).select('amount planName creditsPurchased paymentMethod molliePaymentId status creditsAdded createdAt');

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        credits: wallet ? wallet.credits : 0,
        payments: payments.map(payment => ({
          amount: payment.amount,
          planName: payment.planName,
          creditsPurchased: payment.creditsPurchased,
          paymentMethod: payment.paymentMethod,
          molliePaymentId: payment.molliePaymentId,
          status: payment.status,
          creditsAdded: payment.creditsAdded,
          createdAt: payment.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateUserById = async (req, res) => {
  const { userId } = req.params;
  const { username, email, image, dob, bio } = req.body;


  // Validate ObjectId
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate and update inputs
    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Store image as provided (no Cloudinary validation)
    if (image !== undefined) {
      user.image = image || "";
    }

    if (dob) {
      const parsedDate = new Date(dob);
      if (isNaN(parsedDate.getTime())) { // Fixed typo
        return res.status(400).json({ message: "Invalid date format" });
      }
      if (parsedDate > new Date()) {
        return res.status(400).json({ message: "Date of birth cannot be in the future" });
      }
      user.dob = parsedDate;
    }

    if (bio) {
      if (bio.length > 500) {
        return res.status(400).json({ message: "Bio cannot exceed 500 characters" });
      }
      user.bio = bio;
    }

    await user.save();

    // Return updated user data (excluding sensitive fields)
    const updatedUser = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  registerUser,
  getAllUsers,
  loginUser,
  logoutUser,
 refreshToken,
  forgetPassword,
  resetPassword,
  fetchUserById,
  deleteUserById,
  updateUserById,
  updatePassword,
  getMe,
  getUserByAdmin
};