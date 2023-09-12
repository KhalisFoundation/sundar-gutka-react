import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAppFirstTime = () => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  useEffect(() => {
    (async () => {
      const isOpenedAppBefore = await AsyncStorage.getItem("hasOpenedAppBefore");
      setIsFirstTime(isOpenedAppBefore === null);
      if (isOpenedAppBefore === null) {
        await AsyncStorage.setItem("hasOpenedAppBefore", "true");
      }
    })();
  }, []);
  return isFirstTime;
};

export default useAppFirstTime;
