export const checkIsAudioRemoteExists = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const checkIsJsonRemoteExists = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
};
