import { useEffect } from "react";
import { useSelector } from "react-redux";
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";

const useKeepAwake = () => {
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  useEffect(() => {
    if (isScreenAwake) {
      activateKeepAwake();
    } else {
      deactivateKeepAwake();
    }
  }, [isScreenAwake]);
};

export default useKeepAwake;
