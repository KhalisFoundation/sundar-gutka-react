import { createNavigationContainerRef } from "@react-navigation/native";
import constant from "./constant";

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};
export const navigateTo = (incoming) => {
  const { data } = incoming.notification;
  const params = { key: `Reader-${data.id}`, params: { id: data.id, title: data.gurmukhi } };
  navigate(constant.READER, params);
};
