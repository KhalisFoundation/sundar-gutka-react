import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setVishraamOption, toggleVishraam, setVishraamSource } from "@common/actions";
import { STRINGS } from "@common";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { SettingsToggleRow } from "./comon/SettingsRow";
import { getVishraamSource, getVishraamOption } from "./comon/strings";

const VishraamComponent = () => {
  const [isVishraamOptionVisible, toggleVishraamOptionVisible] = useState(false);
  const [isVishraamSourceVisible, toggleVishraamSourceVisible] = useState(false);
  const isVishraam = useSelector((state) => state.isVishraam);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const vishraamSource = useSelector((state) => state.vishraamSource);

  const dispatch = useDispatch();
  const VISHRAAM_OPTIONS = getVishraamOption(STRINGS);
  const VISHRAAM_SOURCES = getVishraamSource(STRINGS);

  return (
    <>
      <SettingsToggleRow
        title={STRINGS.show_vishraams}
        icon="pause"
        value={isVishraam}
        onValueChange={(value) => dispatch(toggleVishraam(value))}
      />

      {isVishraam && (
        <>
          <ListItemComponent
            icon="format-color-fill"
            isAvatar={false}
            title={STRINGS.vishraam_options}
            value={vishraamOption}
            actionConstant={VISHRAAM_OPTIONS}
            onPressAction={() => toggleVishraamOptionVisible(true)}
          />

          <ListItemComponent
            icon="auto-stories"
            isAvatar={false}
            title={STRINGS.vishraam_source}
            value={vishraamSource}
            actionConstant={VISHRAAM_SOURCES}
            onPressAction={() => toggleVishraamSourceVisible(true)}
          />
        </>
      )}

      <BottomSheetComponent
        isVisible={isVishraamOptionVisible}
        actionConstant={VISHRAAM_OPTIONS}
        value={vishraamOption}
        toggleVisible={toggleVishraamOptionVisible}
        title={STRINGS.vishraam_options}
        action={setVishraamOption}
      />

      <BottomSheetComponent
        isVisible={isVishraamSourceVisible}
        actionConstant={VISHRAAM_SOURCES}
        value={vishraamSource}
        toggleVisible={toggleVishraamSourceVisible}
        title={STRINGS.vishraam_source}
        action={setVishraamSource}
      />
    </>
  );
};
export default VishraamComponent;
