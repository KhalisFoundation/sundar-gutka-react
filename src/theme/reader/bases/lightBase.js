import { light as lightColors } from "@theme/semanticColors";
import createAppBase from "./appBase";

// Today's light Reader, expressed as a reading-theme record. Every value is
// derived from the app's light palette rather than copied out of it — see
// appBase.js for why that matters.
export default createAppBase(lightColors, "light");
