import { constant } from "@common";

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
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: "GET",
      headers: config.headers,
      ...options,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log("API Response:", data);
    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    return null;
  }
};

// Artist data mapper
const mapArtistData = (artist) => ({
  key: artist.artist_id.toString(),
  title: artist.display_name,
  artist_id: artist.artist_id,
  display_name: artist.display_name,
  version_hash: artist.version_hash,
  base_audio_url: artist.base_audio_url,
  quality_levels: artist.quality_levels,
});

export const fetchManifest = async (baniId) => {
  const data = await makeApiRequest(`/media/bani/${baniId}/manifest`);

  if (!data || data.data.length === 0) {
    return null;
  }

  return data;
};

export const fetchArtists = async () => {
  const data = await makeApiRequest("/media/artists");

  if (data?.status === "success" && data.data) {
    return data.data.map(mapArtistData);
  }

  return [];
};
