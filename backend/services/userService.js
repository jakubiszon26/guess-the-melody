import User from "../models/userModel.js";
import Spotify from "./spotifyService.js";
//checks the database if user with specified spotifyID already exists
async function checkIfUserExists(spotifyID) {
  try {
    const exists = await User.exists({ spotifyID: spotifyID });
    return exists;
  } catch (error) {
    console.error("Error during user existance check", error);
    throw new Error("DATA BASE ERROR");
  }
}

async function databaseUpdateTokens(
  spotifyID,
  access_token,
  refresh_token,
  expires_in
) {
  const expiresAt = new Date(Date.now() + expires_in * 1000);
  const updateData = {
    spotifyAccessToken: access_token,
    spotifyTokenExpiresAt: expiresAt,
  };
  if (refresh_token) {
    updateData.spotifyRefreshToken = refresh_token;
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { spotifyID: spotifyID },
      { $set: updateData },
      { new: true }
    );
    if (!updatedUser) {
      console.warn(
        `Próbowano zaktualizować tokeny, ale nie znaleziono usera: ${spotifyID}`
      );
      return null;
    }
    return updatedUser;
  } catch (err) {
    throw new Error(err);
  }
}

async function databaseCreateUser(
  spotifyID,
  access_token,
  refresh_token,
  expires_in
) {
  const expiresAt = new Date(Date.now() + expires_in * 1000);
  const spotifyUserData = await Spotify.me(access_token);

  const newUserData = {
    spotifyID: spotifyID,
    spotifyAccessToken: access_token,
    spotifyRefreshToken: refresh_token,
    spotifyTokenExpiresAt: expiresAt,
    displayName: spotifyUserData.display_name,
  };
  try {
    const newUser = await User.create(newUserData);
    return newUser;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
}
async function validateSpotifyToken(spotifyID) {} //nie pamietam do czego to mialo sluzyc
async function generateInternalToken(fastify, user) {
  if (!user.spotifyID) {
    throw Error("cannot generate token without userID");
  }
  const payload = {
    spotifyID: user.spotifyID,
  };
  const sessionToken = fastify.jwt.sign(payload, {
    expiresIn: "7d",
  });
  if (sessionToken) {
    return sessionToken;
  }
}
async function getSpotifyTokenFromDatabase(spotifyID) {
  try {
    const userData = await User.findOne({ spotifyID: spotifyID });
    if (userData) {
      return userData.spotifyAccessToken;
    }
  } catch (error) {
    throw new Error(error);
  }
}

export {
  checkIfUserExists,
  databaseUpdateTokens,
  databaseCreateUser,
  validateSpotifyToken,
  generateInternalToken,
  getSpotifyTokenFromDatabase,
};
