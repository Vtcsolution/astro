const mongoose = require ("mongoose")
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  image: { type: String, default: "" },
  password: { type: String, required: true, minlength: 6 },
  dob: { type: Date, required: true },
  birthTime: { type: String, trim: true },
  birthPlace: { type: String, trim: true },
  bio: { type: String, trim: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hasRequestedFreeReport: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);