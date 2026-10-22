import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleParagraphMode } from "@common/actions";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const ParagraphMode = () => {
  const dispatch = useDispatch();
  const isParagraphMode = useSelector((state) => state.isParagraphMode);

  return (
    <SettingsToggleRow
      title={STRINGS.PARAGRAPH_MODE}
      icon="view-headline"
      value={isParagraphMode}
      onValueChange={(value) => dispatch(toggleParagraphMode(value))}
    />
  );
};

export default ParagraphMode;
