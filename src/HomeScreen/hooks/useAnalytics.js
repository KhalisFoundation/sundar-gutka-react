import { useEffect } from "react";
import { allowTracking } from "../../common/analytics";

const useAnalytics = () => {
  useEffect(() => {
    allowTracking();
  }, []);
};
export default useAnalytics;
