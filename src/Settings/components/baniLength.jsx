import React, { useState } from "react";
import { useSelector } from "react-redux";
import { STRINGS, actions } from "@common";
import { ListItemComponent, BottomSheetComponent } from "./comon";
import { getBaniLengths } from "./comon/strings";

const BaniLengthComponent = () => {
  const [isVisible, toggleVisible] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  const baniLengthIcon = require("../../../images/banilengthicon.png");
  const BANI_LENGTHS = getBaniLengths(STRINGS);
  return (
    <>
      <ListItemComponent
        icon={baniLengthIcon.toString()}
        isAvatar
        title={STRINGS.bani_length}
        value={baniLength}
        actionConstant={BANI_LENGTHS}
        onPressAction={() => toggleVisible(true)}
      />
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={BANI_LENGTHS}
          value={baniLength}
          toggleVisible={toggleVisible}
          title={STRINGS.bani_length}
          action={actions.setBaniLength}
        />
      )}
    </>
  );
};

export default BaniLengthComponent;
