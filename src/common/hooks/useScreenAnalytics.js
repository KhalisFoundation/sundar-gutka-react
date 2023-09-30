import { useEffect } from "react";
import { trackScreenView } from "../analytics";

const useScreenAnalytics = (screenName, screenClass) => {
  useEffect(() => {
    trackScreenView(screenName, screenClass);
  }, []);
};

export default useScreenAnalytics;
