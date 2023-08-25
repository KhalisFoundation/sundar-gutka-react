import React, { useEffect } from "react";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useSelector } from "react-redux";

function EditBaniOrder() {
  const { transliterationLanguage } = useSelector((state) => state);
  useEffect(() => {
    (async () => {})();
  }, [transliterationLanguage]);
}
export default EditBaniOrder;
