import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    spotifyID: {
      type: String,
      required: [true, "Spotify ID is required"],
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    spotifyRefreshToken: {
      type: String,
      required: true,
    },
    spotifyAccessToken: {
      type: String,
      required: false,
    },
    spotifyTokenExpiresAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
