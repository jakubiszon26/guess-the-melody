import axios from "axios";

const spotifyApiUrl = "https://api.spotify.com/v1";

export const fetchUserProfile = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const response = await axios.get(spotifyApiUrl + "/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data", error);
    return null;
  }
};
