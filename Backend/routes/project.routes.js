import {Router} from "express";
import {body} from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authMiddleWare.authUser,
  body("name").isString().withMessage("Name is required"),
  body("fileTree")
    .optional()
    .isObject()
    .withMessage("fileTree must be an object"),
  projectController.createProject
);

router.get("/all", authMiddleWare.authUser, projectController.getAllProject);

router.put(
  "/add-user",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("users")
    .isArray({min: 1})
    .withMessage("Users must be an array of strings")
    .bail()
    .custom((users) => users.every((user) => typeof user === "string"))
    .withMessage("Each user must be a string"),
  projectController.addUserToProject
);

router.get(
  "/get-project/:projectId",
  authMiddleWare.authUser,
  projectController.getProjectById
);

router.delete(
  "/delete/:projectId",
  authMiddleWare.authUser,
  projectController.deleteProject
);

router.patch(
  "/update-flow/:projectId",
  authMiddleWare.authUser,
  body("fileTree").isObject().withMessage("fileTree must be an object"),
  body("fileTree.nodes")
    .isArray()
    .withMessage("fileTree.nodes must be an array"),
  body("fileTree.edges")
    .isArray()
    .withMessage("fileTree.edges must be an array"),
  projectController.updateFlow
);

router.patch(
  "/update-name/:projectId",
  authMiddleWare.authUser,
  body("name").isString().withMessage("New name is required"),
  projectController.updateProjectName
);

router.get(
  "/search",
  authMiddleWare.authUser,
  projectController.searchProjectsByName
);

router.patch(
  "/remove-user",
  authMiddleWare.authUser,
  body("projectId").isString(),
  body("userToRemove").isString(),
  projectController.removeUserFromProject
);

router.patch(
  "/whatsapp-config/:projectId",
  authMiddleWare.authUser,
  projectController.updateWhatsappConfig
);


router.patch(
  "/toggle-active/:projectId",
  authMiddleWare.authUser,
  projectController.toggleProjectActiveState
);


export default router;
