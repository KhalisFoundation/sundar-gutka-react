import { createContext } from "react";

/**
 * The height, in points, a sheet has left for the on-screen keyboard pinned
 * under it: its max height less its padding, title, header, footer and the
 * list room it keeps. Undefined outside a sheet, where the keyboard falls back
 * to its own share of the window.
 */
const SheetKeyboardSpace = createContext(undefined);

export default SheetKeyboardSpace;
