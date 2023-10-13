import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAppFirstTime = () => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  useEffect(() => {
    (async () => {
      const value = await AsyncStorage.getItem("hasOpenedAppBefore");
      if (value !== null) {
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
        await AsyncStorage.setItem("hasOpenedAppBefore", "true");
      }
    })();
  }, []);
  return isFirstTime;
};

export default useAppFirstTime;
