// Use HEAD to check existence — avoids downloading the full response body,
// saving bandwidth and keeping the radio active for the shortest possible time.
export const checkIsAudioRemoteExists = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const checkIsJsonRemoteExists = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};
