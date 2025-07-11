import { constant } from "@common";

const fetchManifest = async (baniId) => {
  try {
    const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, REMOTE_AUDIO_API_URL } = constant;
    // Create basic auth header
    const credentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`);
    const authHeader = `Basic ${credentials}`;
    console.log("authHeader", authHeader);
    const response = await fetch(`${REMOTE_AUDIO_API_URL}/media/bani/${baniId}/manifest`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching manifest:", error);
    throw error;
  }
};

export default fetchManifest;
