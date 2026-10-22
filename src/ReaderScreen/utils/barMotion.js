import { Easing } from "react-native";

// How the Reader's bars move when they show or hide: the header, the bottom
// nav, and the audio player and progress track that ride on the nav. One spec
// for all of them, so the header and the nav travel as one piece instead of
// drifting apart on two different clocks.
//
// The values are Material's own hide-on-scroll bar
// (HideBottomViewOnScrollBehavior): a 225ms decelerating entry, which moves
// from the first frame and settles into place, and a quicker 175ms
// accelerating exit. The default ease-in-out spends its opening frames barely
// moving, which on the way in reads as the bar lagging behind the tap.
export const BAR_SHOW = { duration: 225, easing: Easing.bezier(0, 0, 0.2, 1) };
export const BAR_HIDE = { duration: 175, easing: Easing.bezier(0.4, 0, 1, 1) };

/** The timing config for bars becoming `visible` (or hidden). */
export const barMotion = (visible) => (visible ? BAR_SHOW : BAR_HIDE);
