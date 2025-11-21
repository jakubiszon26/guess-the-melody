import axios from "axios";

async function deezerGet(endpoint, data) {
  if (!data) {
    data = {};
  }
  const queryData = new URLSearchParams(data);

  try {
    const response = await axios.get(endpoint, {
      params: queryData,
    });
    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error fetching data", error.message);
    throw error;
  }
}

function cleanTitle(title) {
  if (!title) return "";
  return title.split(" - ")[0].split(" (")[0];
}

const Deezer = {
  async getTrackPreview(tracksArray, index) {
    const trackData = tracksArray[index];

    if (!trackData) {
      return null;
    }

    const { isrc, artist, title } = trackData;
    if (isrc) {
      try {
        const response = await deezerGet("https://api.deezer.com/search", {
          q: `isrc:${isrc}`,
        });
        if (
          response.data &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          return response.data.data[0].preview;
        }
      } catch (err) {}
    }
    if (artist && title) {
      const simpleTitle = cleanTitle(title);
      const query = `artist:"${artist}" track:"${simpleTitle}"`;
      try {
        const response = await deezerGet("https://api.deezer.com/search", {
          q: query,
        });

        if (
          response.data &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          return response.data.data[0].preview;
        }
      } catch (err) {
        console.warn("[Deezer]", err.message);
      }
    }

    console.warn("no preview found");
    return null;
  },
};

export default Deezer;
