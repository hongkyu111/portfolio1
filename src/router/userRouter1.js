import { see, 
    logout, 
    startGithubLogin, 
    finishGithubLogin, 
    getEdit, 
    postEdit, 
    getChangePassword, 
    postChangePassword, } from "../controllers/userController";
import express from "express";
import { avatarUpload, protectorMiddleware, publicOnlyMiddleware} from "../middlewares";

const userRouter1 = express.Router();

userRouter1
.route("/logout")
.all(protectorMiddleware)
.get(logout);

userRouter1
.route("/edit")
.all(protectorMiddleware)
.get(getEdit)
.post(avatarUpload.single("avatar"), postEdit);

userRouter1
.route("/change-password")
.all(protectorMiddleware)
.get(getChangePassword)
.post(postChangePassword);

userRouter1.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter1.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);

userRouter1.get("/:id", see);

export default userRouter1;