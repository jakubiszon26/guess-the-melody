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
