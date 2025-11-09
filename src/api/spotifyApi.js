import axios from "axios";

const apiurl = "http://127.0.0.1:3001";
export const exchangeCodeForToken = async (code) => {
  axios
    .get("http://127.0.0.1:3001/users/getToken", {
      params: { code },
      withCredentials: true,
    })
    .then((response) => {
      console.log(response.data);
      if (response.data.login === "success") {
        return true;
      } else {
        return false;
      }
    });
};

export const fetchUserProfile = async () => {
  try {
    const response = await axios.get(apiurl + "/users/fetch-user-profile", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data", error);
    return null;
  }
};

export const checkAuth = async () => {
  try {
    const response = await axios.get(apiurl + "/users/checkAuth", {
      withCredentials: true,
    });
    return response.data.authenticated;
  } catch (error) {
    console.error("Error checking authentication", error);
    return false;
  }
};

export const fetchPlayingTrack = async () => {
  try {
    const response = await axios.get(apiurl + "/music/currently-playing", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching currently playing track", error);
    return null;
  }
};

export const getTrackInfo = async (trackId) => {
  try {
    const response = await axios.get(apiurl + "/music/get-track-info", {
      params: { id: trackId },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching track info", error);
    return null;
  }
};

export const getAccessToken = async () => {
  try {
    const response = await axios.get(apiurl + "/users/getAccessToken", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching access token", error);
    return null;
  }
};

export const findPrieviewUrl = async (track, artist) => {
  try {
    const response = await axios.get(apiurl + "/music/find-preview-url", {
      params: { track, artist },
      withCredentials: true,
    });
    return response.data.previewUrl;
  } catch (error) {
    console.error("Error finding preview URL", error);
    return null;
  }
};
