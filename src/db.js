import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL), {
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true,
};

const db = mongoose.connection;
const handleOpen = () => console.log("â Connected to DB");
const handleError = (error) => console.log("âDB Error ð¢", error);

db.on("error",handleError);
db.once("open", handleOpen);

