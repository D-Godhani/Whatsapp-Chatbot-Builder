import express from "express";
import morgan from "morgan";
import connectDB from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
// import aiRoutes from './routes/ai.routes.js';
import cookieParser from "cookie-parser";
import cors from "cors";
import * as authMiddleWare from "./middleware/auth.middleware.js";
connectDB();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/projects", authMiddleWare.authUser, projectRoutes);
app.use("/api", authMiddleWare.authUser, webhookRoutes);
// app.use('/api/twilio', twilioRoutes);
// app.use('/api/admin', adminRoutes);

export default app;
