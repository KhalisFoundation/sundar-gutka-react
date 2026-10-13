import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleScreenAwake } from "@common/actions";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const KeepAwake = () => {
  const dispatch = useDispatch();
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);

  return (
    <SettingsToggleRow
      title={STRINGS.KEEP_AWAKE}
      iconImage={require("../../../images/screenonicon.png")}
      value={isScreenAwake}
      disabled={isAutoScroll}
      onValueChange={(value) => dispatch(toggleScreenAwake(value))}
    />
  );
};

export default KeepAwake;
