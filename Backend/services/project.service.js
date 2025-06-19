import projectModel from "../models/project.model.js";
import mongoose from "mongoose";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const createProject = async ({
  name,
  userId,
  fileTree = { nodes: [], edges: [] },
}) => {
  if (!name) throw new Error("Name is required");
  if (!userId) throw new Error("UserId is required");

  try {
    const project = await projectModel.create({
      name,
      users: [userId],
      fileTree,
      createdBy: userId,
    });
    return project;
  } catch (error) {
    if (error.code === 11000) throw new Error("Project name already exists");
    throw error;
  }
};

export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) {
    throw new Error("UserId is required");
  }

  const allUserProjects = await projectModel.find({
    users: userId,
  });

  return allUserProjects;
};

export const addUsersToProject = async ({ projectId, users, userId }) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!users) {
    throw new Error("users are required");
  }

  if (
    !Array.isArray(users) ||
    users.some((userId) => !mongoose.Types.ObjectId.isValid(userId))
  ) {
    throw new Error("Invalid userId(s) in users array");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const project = await projectModel.findOne({
    _id: projectId,
    users: userId,
  });

  console.log(project);

  if (!project) {
    throw new Error("User not belong to this project");
  }

  const updatedProject = await projectModel.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      $addToSet: {
        users: {
          $each: users,
        },
      },
    },
    {
      new: true,
    }
  );

  return updatedProject;
};

export const getProjectById = async ({ projectId }) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await projectModel
    .findOne({
      _id: projectId,
    })
    .populate("users");

  return project;
};

export const deleteProjectById = async ({ projectId, userId }) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  const project = await projectModel.findOne({ _id: projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  // Optional: Only allow deletion if the user is part of the project
  const isUserInProject = project.users.includes(userId);
  if (!isUserInProject) {
    throw new Error("User does not have permission to delete this project");
  }

  await projectModel.deleteOne({ _id: projectId });

  return { message: "Project deleted successfully" };
};

export const updateProjectFlow = async ({ projectId, fileTree }) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  project.fileTree = fileTree;
  return await project.save();
};

export const updateProjectName = async ({ projectId, name, userId }) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!name || typeof name !== "string") {
    throw new Error("Project name must be a valid string");
  }

  const project = await projectModel.findOne({ _id: projectId });

  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.users.includes(userId)) {
    throw new Error("User does not have permission to update this project");
  }

  project.name = name.toLowerCase().trim();

  try {
    return await project.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Project name already exists");
    }
    throw err;
  }
};

export const searchProjectsByName = async ({ name, userId }) => {
  if (!name || !userId) {
    throw new Error("Name and userId are required");
  }

  const regex = new RegExp(name, "i"); // case-insensitive partial match

  const projects = await projectModel.find({
    name: { $regex: regex },
    users: userId,
  });

  return projects;
};

export const removeUserFromProject = async ({
  projectId,
  userToRemove,
  requestedBy,
}) => {
  if (!isValidObjectId(projectId) || !isValidObjectId(userToRemove)) {
    throw new Error("Invalid IDs");
  }
  const project = await projectModel.findOne({ _id: projectId });

  if (!project) throw new Error("Project not found");
  if (!project.users.includes(requestedBy)) throw new Error("Not authorized");

  project.users = project.users.filter((u) => u.toString() !== userToRemove);
  return await project.save();
};

export const updateWhatsappConfig = async ({
  projectId,
  userId,
  configData,
}) => {
  if (!isValidObjectId(projectId)) throw new Error("Invalid Project ID");

  const project = await projectModel.findOne({ _id: projectId, users: userId });

  if (!project) {
    throw new Error("Project not found or user not authorized");
  }

  const {
    whatsappPhoneNumberId,
    whatsappAccessToken,
    whatsappWebhookVerifyToken,
  } = configData;

  project.whatsappPhoneNumberId = whatsappPhoneNumberId;
  project.whatsappAccessToken = whatsappAccessToken;
  project.whatsappWebhookVerifyToken = whatsappWebhookVerifyToken;

  return await project.save();
};
