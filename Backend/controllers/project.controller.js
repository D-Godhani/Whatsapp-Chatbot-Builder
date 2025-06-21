import projectModel from "../models/project.model.js";
import * as projectService from "../services/project.service.js";
import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";

export const createProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, fileTree } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    const newProject = await projectService.createProject({
      name,
      userId,
      fileTree,
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};
export const getAllProject = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    const allUserProjects = await projectService.getAllProjectByUserId({
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      projects: allUserProjects,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId, users } = req.body;

    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    const project = await projectService.addUsersToProject({
      projectId,
      users,
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await projectService.getProjectById({ projectId });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const result = await projectService.deleteProjectById({
      projectId,
      userId: loggedInUser._id,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateFlow = async (req, res) => {
  const { projectId } = req.params;
  const { fileTree } = req.body;

  try {
    const updatedProject = await projectService.updateProjectFlow({
      projectId,
      fileTree,
    });

    return res.status(200).json({
      message: "Flow updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const updateProjectName = async (req, res) => {
  const { projectId } = req.params;
  const { name } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const updatedProject = await projectService.updateProjectName({
      projectId,
      name,
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      message: "Project name updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};


export const searchProjectsByName = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Project name query is required' });
  }

  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const results = await projectService.searchProjectsByName({
      name,
      userId: loggedInUser._id
    });

    return res.status(200).json({ projects: results });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

export const removeUserFromProject = async (req, res) => {
  const { projectId, userToRemove } = req.body;
  try {
    const currentUser = await userModel.findOne({ email: req.user.email });

    const result = await projectService.removeUserFromProject({
      projectId,
      userToRemove,
      requestedBy: currentUser._id,
    });

    res.status(200).json({ project: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateWhatsappConfig = async (req, res) => {
  const { projectId } = req.params;
  const {
    whatsappPhoneNumberId,
    whatsappAccessToken,
    whatsappWebhookVerifyToken,
  } = req.body;

  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const updatedProject = await projectService.updateWhatsappConfig({
      projectId,
      userId: loggedInUser._id,
      configData: {
        whatsappPhoneNumberId,
        whatsappAccessToken,
        whatsappWebhookVerifyToken,
      },
    });

    return res.status(200).json({
      message: "WhatsApp configuration updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const toggleProjectActiveState = async (req, res) => {
  const { projectId } = req.params;

  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    const result = await projectService.toggleProjectActiveState({
      projectId,
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      message: result.message,
      project: result.project,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};
