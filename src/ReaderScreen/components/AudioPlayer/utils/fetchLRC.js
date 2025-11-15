// Function to fetch JSON file content

import { showErrorToast, STRINGS } from "@common";

const fetchLRCData = async (jsonUrl) => {
  try {
    const response = await fetch(jsonUrl);

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return false;
  } catch (error) {
    showErrorToast(STRINGS.AUDIO_SYNC_UNAVAILABLE);
    return false;
  }
};

export default fetchLRCData;
