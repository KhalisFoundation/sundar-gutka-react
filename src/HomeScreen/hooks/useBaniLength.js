import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useBaniLength = () => {
  const [baniLengthSelector, toggleBaniLengthSelector] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  useEffect(() => {
    toggleBaniLengthSelector(baniLength === "");
  }, [baniLength]);
  return { baniLengthSelector };
};
export default useBaniLength;
