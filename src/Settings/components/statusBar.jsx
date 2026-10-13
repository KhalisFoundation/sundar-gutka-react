import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleStatusBar } from "@common/actions";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const StatusBar = () => {
  const dispatch = useDispatch();
  const isStatusBar = useSelector((state) => state.isStatusBar);

  return (
    <SettingsToggleRow
      title={STRINGS.HIDE_STATUS_BAR}
      // The icon reflects the current state: an eye when the bar is shown, a
      // struck-through eye when it is hidden.
      icon={isStatusBar ? "visibility-off" : "visibility"}
      value={isStatusBar}
      onValueChange={(value) => dispatch(toggleStatusBar(value))}
    />
  );
};

export default StatusBar;
