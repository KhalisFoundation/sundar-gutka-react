import { createNavigationContainerRef } from "@react-navigation/native";
import { getBaniByID } from "@database";
import constant from "./constant";
import { logError } from "./firebase/crashlytics";

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const navigateTo = async (incoming) => {
  if (!incoming?.notification?.data) {
    logError("navigateTo called with invalid notification data");
    return;
  }

  const { data } = incoming.notification;

  // Try to fetch titleUni from database if not provided in notification
  let titleUni = data.gurmukhiUni;
  if (!titleUni && data.id) {
    try {
      const baniData = await getBaniByID(data.id);
      if (baniData) {
        titleUni = baniData.gurmukhiUni;
      }
    } catch (error) {
      // If fetching fails, continue without titleUni - it will fallback to title
    }
  }

  const params = {
    key: `Reader-${data.id}`,
    params: {
      id: data.id,
      title: data.gurmukhi,
      ...(titleUni && { titleUni }),
    },
  };
  navigate(constant.READER, params);
};
