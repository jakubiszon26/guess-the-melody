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
async function validateSpotifyToken(spotifyID) {
  try {
    const userData = await User.findOne({ spotifyID: spotifyID });
    if (userData) {
      if (userData.spotifyTokenExpiresAt < Date.now()) {
        return {
          valid: false,
          token: userData.spotifyAccessToken,
          refreshToken: userData.spotifyRefreshToken,
        };
      } else {
        return { valid: true, token: userData.spotifyAccessToken };
      }
    } else {
      throw new Error("no userdata");
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
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
    const spotifyToken = await validateSpotifyToken(spotifyID);
    if (spotifyToken.valid) {
      return spotifyToken.token;
    } else {
      const refreshedToken = await Spotify.refreshToken(
        spotifyToken.refreshToken
      );
      databaseUpdateTokens(
        spotifyID,
        refreshedToken.access_token,
        refreshedToken.refresh_token,
        refreshedToken.expires_in
      );
      return refreshedToken.access_token;
    }
  } catch (error) {
    console.error(error);
    throw error;
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
