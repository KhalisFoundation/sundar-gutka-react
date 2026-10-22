import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useBaniLength = () => {
  const baniLength = useSelector((state) => state.baniLength);
  // Initialize synchronously from Redux so the very first render already
  // shows the selector when needed — deferring this to an effect let BaniList
  // flash on screen for a frame before flipping over.
  const [baniLengthSelector, toggleBaniLengthSelector] = useState(() => baniLength === "");
  useEffect(() => {
    toggleBaniLengthSelector(baniLength === "");
  }, [baniLength]);
  return { baniLengthSelector };
};
export default useBaniLength;
