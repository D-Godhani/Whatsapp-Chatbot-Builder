import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from '../services/redis.service.js';
import crypto from 'crypto';
import { sendEmail } from '../services/email.Service.js';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

export const googleLoginController = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID token is required" });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name: fullname,
      email_verified,
    } = payload;

    if (!email_verified) return res.status(403).json({ message: "Email not verified by Google" });

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        fullname,
        email,
        phoneNumber: null,
        password: null,
        isAdmin: false,
        googleAuth: true,
        googleId,
      });
    }

    const token = user.generateJWT();
    delete user._doc.password;

    res.status(200).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Google login failed' });
  }
};

export const createUserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await userService.createUser(req.body);

    const token = await user.generateJWT();

    delete user._doc.password;

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const loginController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await userService.loginUser(req.body);

    const token = await user.generateJWT();

    delete user._doc.password;

    res.status(200).json({ user, token });
  } catch (err) {
    console.log(err);

    res.status(400).send(err.message);
  }
};

export const profileController = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

export const logoutController = async (req, res) => {
    try {

        const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        res.status(200).json({
            message: 'Logged out successfully'
        });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    const allUsers = await userService.getAllUsers({
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      users: allUsers,
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({ error: err.message });
  }
  
};

export const sendResetCodeController = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await redisClient.set(`reset-code:${email}`, resetCode, 'EX', 10 * 60); // expires in 10 mins

    await sendEmail(email, 'Password Reset Code', `Your code is: ${resetCode}`);

    res.status(200).json({ message: "Reset code sent to email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyResetCodeController = async (req, res) => {
  const { email, code } = req.body;

  try {
    const storedCode = await redisClient.get(`reset-code:${email}`);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ message: "Invalid or expired code." });
    }

    await redisClient.set(`reset-verified:${email}`, 'true', 'EX', 10 * 60);

    res.status(200).json({ message: "Code verified. You can now reset your password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPasswordController = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const verified = await redisClient.get(`reset-verified:${email}`);
    if (!verified) return res.status(403).json({ message: "Unauthorized. Verify code first." });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await redisClient.del(`reset-code:${email}`);
    await redisClient.del(`reset-verified:${email}`);

    res.status(200).json({ message: "Password successfully reset." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};