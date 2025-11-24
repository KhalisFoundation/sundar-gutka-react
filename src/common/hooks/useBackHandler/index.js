import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";

const useBackHandler = (handleBackPress) => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleBack = () => {
      if (handleBackPress && typeof handleBackPress === "function") {
        return handleBackPress();
      }
      // Default behavior: navigate back
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => backHandler.remove();
  }, [handleBackPress, navigation]);
};

export default useBackHandler;
