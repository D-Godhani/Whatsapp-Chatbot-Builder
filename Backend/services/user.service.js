import userModel from "../models/user.model.js";

export const createUser = async ({
  fullname,
  email,
  phoneNumber,
  password,
  isAdmin,
}) => {
  if (!fullname || !email || !phoneNumber || !password) {
    throw new Error("Something is missing");
  }

  const user_search = await userModel.findOne({ email });
  if (user_search) {
    throw new Error("user already exist with this email");
  }
  const hashedPassword = await userModel.hashPassword(password);

  const user = await userModel.create({
    fullname,
    email,
    phoneNumber,
    password: hashedPassword,
    isAdmin,
  });

  return user;
};

export const loginUser = async ({ email, password, isAdmin }) => {
  if (!email || !password) {
    throw new Error("All fields are required");
  }

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    throw new Error("Invalid Credentials");
  }

  const isMatch = await user.isValidPassword(password);

  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  const parsedIsAdmin = isAdmin === 'true' || isAdmin === true;
  if (parsedIsAdmin !== user.isAdmin) {
    throw new Error("Account doesn't exist with current role.");
  }

  return user;
};

export const getAllUsers = async ({ userId }) => {
  const users = await userModel.find({
    _id: { $ne: userId },
  });
  return users;
};