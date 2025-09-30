import { unicode } from "anvaad-js";

const convertToUnicode = (word) => {
  try {
    // Check if word is provided and is a string
    if (!word) {
      return "";
    }

    if (typeof word !== "string") {
      return String(word);
    }

    // Convert to unicode
    const result = unicode(word);

    // Check if conversion was successful
    if (!result) {
      return word; // Return original word if conversion fails
    }

    return result;
  } catch (error) {
    // Return original word as fallback in case of any error
    return word;
  }
};

export default convertToUnicode;
