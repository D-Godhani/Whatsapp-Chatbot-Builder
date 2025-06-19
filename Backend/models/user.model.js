import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minLength: [6, "Email must be atleast 6 characters long"],
      maxLength: [50, "Email must not be longer than 50 characters"],
    },
    phoneNumber: {
      type: Number,
      required: false,
    },
    password: {
      type: String,
      select: false,
      required: false,
    },
    isAdmin: { type: Boolean, default: false },
    googleAuth: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign({ email: this.email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const User = mongoose.model("user", userSchema);

export default User;
