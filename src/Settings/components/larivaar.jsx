import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleLarivaar, toggleLarivaarAssist } from "@common/actions";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const LarivaarComponent = () => {
  const dispatch = useDispatch();
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);

  return (
    <>
      <SettingsToggleRow
        title={STRINGS.larivaar}
        iconImage={require("../../../images/larivaaricon.png")}
        value={isLarivaar}
        onValueChange={(value) => dispatch(toggleLarivaar(value))}
      />
      {isLarivaar && (
        <SettingsToggleRow
          title={STRINGS.larivaar_assist}
          icon="opacity"
          value={isLarivaarAssist}
          onValueChange={(value) => dispatch(toggleLarivaarAssist(value))}
        />
      )}
    </>
  );
};

export default LarivaarComponent;
