import express from "express";
import morgan from "morgan";
import session from "express-session";
import MongoStore from "connect-mongo";
import rootRouter from "./router/rootRouter";
import videoRouter from "./router/videoRouter";
import { localsMiddleware } from "./middlewares";
import userRouter1 from "./router/userRouter1";

const app = express();
const logger = morgan("dev");

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({extended:true}));

app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
    })
);

app.use(localsMiddleware);
app.use("/upload", express.static("upload"));
app.use("/", rootRouter);
app.use("/video", videoRouter);
app.use("/user", userRouter1);

export default app;