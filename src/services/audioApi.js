// import { constant } from "@common";
import { dummyData, dummyArtists } from "./dummyData";

// Common API configuration
// const getApiConfig = () => {
//   const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, REMOTE_AUDIO_API_URL } = constant;
//   const credentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`);
//   return {
//     baseUrl: REMOTE_AUDIO_API_URL,
//     headers: {
//       Authorization: `Basic ${credentials}`,
//       "Content-Type": "application/json",
//     },
//   };
// };

// Generic API request function
// const makeApiRequest = async (endpoint, options = {}) => {
//   try {
//     const config = getApiConfig();
//     const fullUrl = `${config.baseUrl}${endpoint}`;

//     console.log("🔗 Making API request to:", fullUrl);
//     console.log("📱 Platform:", require("react-native").Platform.OS);

//     const response = await fetch(fullUrl, {
//       method: "GET",
//       headers: config.headers,
//       timeout: 15000, // 15 second timeout for slow networks
//       ...options,
//     });

//     console.log("📊 Response status:", response.status);

//     if (!response.ok) {
//       console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
//       return null;
//     }

//     const data = await response.json();
//     console.log("✅ API Response:", data);
//     return data;
//   } catch (error) {
//     console.error("💥 API Request Error:", error.message);
//     console.error("🔍 Error type:", error.name);

//     // Specific error handling for network issues
//     if (error.message.includes("Network request failed")) {
//       console.error("🌐 Network connectivity issue. Check:");
//       console.error("   - Server is running on port 3000");
//       console.error("   - Android: Use 10.0.2.2 instead of localhost");
//       console.error("   - iOS: Use localhost or actual IP");
//       console.error("   - Network security config allows HTTP");
//     }

//     return null;
//   }
// };

// Artist data mapper
const mapArtistData = (artist) => ({
  key: artist.artist_id.toString(),
  title: artist.display_name,
  artist_id: artist.artist_id,
  display_name: artist.display_name,
  description: artist.description,
});

export const fetchManifest = async (baniId) => {
  // const data = await makeApiRequest(`/banis/${baniId}`);

  // if (!data || data.data.length === 0) {
  //   return null;
  // }
  // return data;
  const dummy = { data: dummyData[baniId] };
  return dummy;
};

export const fetchArtists = async () => {
  // const data = await makeApiRequest("/artists");

  // if (data?.status === "success" && data.data) {
  //   return data.data.map(mapArtistData);
  // }

  return dummyArtists.map(mapArtistData);
};
