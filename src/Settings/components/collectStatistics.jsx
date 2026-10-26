import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS, actions } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const CollectStatistics = () => {
  const dispatch = useDispatch();
  const isStatistics = useSelector((state) => state.isStatistics);

  return (
    <SettingsToggleRow
      title={STRINGS.COLLECT_STATISTICS}
      iconImage={require("../../../images/analyticsicon.png")}
      value={isStatistics}
      onValueChange={(value) => dispatch(actions.toggleStatistics(value))}
    />
  );
};

export default CollectStatistics;
