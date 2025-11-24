// Function to fetch JSON file content

import { readFile } from "react-native-fs";
import { checkIsRemote, extractFilePath } from "./urlHelper";

const fetchLRCData = async (jsonUrl) => {
  try {
    const isRemote = checkIsRemote(jsonUrl);
    if (isRemote) {
      const response = await fetch(jsonUrl);
      return response.json();
    }
    const filePath = extractFilePath(jsonUrl);
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return false;
  }
};

export default fetchLRCData;
