import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useBaniLength = () => {
  const [baniLengthSelector, toggleBaniLengthSelector] = useState(false);
  const { baniLength } = useSelector((state) => state);
  useEffect(() => {
    toggleBaniLengthSelector(false);
    if (baniLength === "") {
      toggleBaniLengthSelector(true);
    }
  }, [baniLength]);
  return { baniLengthSelector };
};
export default useBaniLength;
