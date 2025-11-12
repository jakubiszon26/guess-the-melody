import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    const connString = process.env.MONGO_URI;
    if (!connString) {
      console.error("No MONGO_URI in .env");
      process.exit(1);
    }

    const conn = await mongoose.connect(connString);
    console.log("Connected to mongo at ", conn.connection.host);
  } catch (error) {
    console.error("COULDNT CONNECT TO DATABASE ERROR: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
