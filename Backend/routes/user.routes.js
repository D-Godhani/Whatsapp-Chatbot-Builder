import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { strongPasswordChecker } from "../validators/strongPasswordChecker.js";

const router = Router();
router.post(
  "/register",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  strongPasswordChecker("password"),
  userController.createUserController
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  userController.loginController
);

router.post(
  "/google-login",
  body("idToken").notEmpty().withMessage("ID Token is required"),
  userController.googleLoginController
);

router.get(
  "/profile",
  authMiddleware.authUser,
  userController.profileController
);

router.get("/logout", authMiddleware.authUser, userController.logoutController);

router.get('/all', authMiddleware.authUser, userController.getAllUsersController);

// password-reset functionality
router.post(
  "/reset-password/send-code",
  body("email").isEmail().withMessage("Email must be valid"),
  userController.sendResetCodeController
);

router.post(
  "/reset-password/verify-code",
  body("email").isEmail().withMessage("Email must be valid"),
  body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
  userController.verifyResetCodeController
);

router.post(
  "/reset-password",
  body("email").isEmail().withMessage("Email must be valid"),
  strongPasswordChecker("newPassword"),
  userController.resetPasswordController
);


export default router;
