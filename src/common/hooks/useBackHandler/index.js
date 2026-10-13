import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";

const useBackHandler = (handleBackPress) => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleBack = () => {
      // A screen stays mounted under the one pushed over it, and its listener,
      // registered later, would run first and pop ITSELF out from underneath
      // (goBack() on a screen's own navigation removes that screen). Only the
      // focused screen answers; the rest leave Back to it.
      if (typeof navigation.isFocused === "function" && !navigation.isFocused()) {
        return false;
      }
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
