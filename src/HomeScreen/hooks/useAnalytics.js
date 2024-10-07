import { useEffect } from "react";
import { allowTracking } from "@common";

const useAnalytics = () => {
  useEffect(() => {
    allowTracking();
  }, []);
};
export default useAnalytics;
