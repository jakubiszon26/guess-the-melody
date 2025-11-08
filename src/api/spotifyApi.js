import axios from "axios";

const apiurl = "http://127.0.0.1:3001";

export const fetchUserProfile = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const response = await axios.get(apiurl + "/me", {
      withCredentials: true,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data", error);
    return null;
  }
};

export const checkAuth = async () => {
  try {
    const response = await axios.get(apiurl + "/checkAuth", {
      withCredentials: true,
    });
    return response.data.authenticated;
  } catch (error) {
    console.error("Error checking authentication", error);
    return false;
  }
};
