// Feather carries the lucide-lineage names the prototype used; `coins` is absent from
// Feather, so it comes from FontAwesome5. Reward items are bundled art, tinted.
import React from "react";
import { Image } from "react-native";
import PropTypes from "prop-types";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

const REWARDS = {
  rabab: require("../../../assets/kids/rewards/rabab.png"),
  satchel: require("../../../assets/kids/rewards/satchel.png"),
  shirt: require("../../../assets/kids/rewards/shirt.png"),
  basket: require("../../../assets/kids/rewards/basket.png"),
  leaf: require("../../../assets/kids/rewards/leaf.png"),
  hand: require("../../../assets/kids/rewards/hand.png"),
};

const FEATHER = {
  settings: "settings",
  "chevron-left": "chevron-left",
  home: "home",
  "book-open": "book-open",
  map: "map",
  navigation: "navigation",
  headphones: "headphones",
  mic: "mic",
  "volume-2": "volume-2",
  star: "star",
};

export const Icon = ({ name, color, size = 22 }) => {
  if (REWARDS[name]) {
    return <Image source={REWARDS[name]} style={{ width: size, height: size, tintColor: color }} />;
  }
  if (name === "coins") {
    return <FontAwesome5 name="coins" color={color} size={size * 0.9} />;
  }
  return <Feather name={FEATHER[name]} color={color} size={size} />;
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number,
};

export default Icon;
