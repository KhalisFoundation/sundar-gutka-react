import { constant, showErrorToast } from "@common";

// Common API configuration
const getApiConfig = () => {
  const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, REMOTE_AUDIO_API_URL } = constant;
  const credentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`);
  return {
    baseUrl: REMOTE_AUDIO_API_URL,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  };
};

// Generic API request function
const makeApiRequest = async (endpoint, options = {}) => {
  try {
    const config = getApiConfig();
    const fullUrl = `${config.baseUrl}${endpoint}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: config.headers,
      timeout: 15000, // 15 second timeout for slow networks
      ...options,
    });

    if (!response.ok) {
      // Log API failures in development for debugging
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Silently fail for network errors - app continues without audio features
    return null;
  }
};

// Artist data mapper
const mapArtistData = (artist) => ({
  key: artist.artist_id.toString(),
  title: artist.display_name,
  artist_id: artist.artist_id,
  display_name: artist.display_name,
  description: artist.description,
});

export const fetchManifest = async (baniId) => {
  const data = await makeApiRequest(`/banis/${baniId}`);

  if (!data || data.data.length === 0) {
    showErrorToast("Audio tracks unavailable. Check your internet connection and try again.");
    return null;
  }
  return data;
};

export const fetchArtists = async () => {
  const data = await makeApiRequest("/artists");

  if (data?.status === "success" && data.data) {
    return data.data.map(mapArtistData);
  }
  showErrorToast("Could not load audio artists. Please check your connection.");
  return null;
};
