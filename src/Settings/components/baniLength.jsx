import React, { useState } from "react";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import { setBaniLength } from "../../common/actions";
import { ListItemComponent, BottomSheetComponent } from "./comon";

function BaniLengthComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  const baniLengthIcon = require("../../../images/banilengthicon.png");
  const BANI_LENGTHS = [
    { key: "SHORT", title: STRINGS.short },
    { key: "MEDIUM", title: STRINGS.medium },
    { key: "LONG", title: STRINGS.long },
    { key: "EXTRA_LONG", title: STRINGS.extra_long },
  ];
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
          action={setBaniLength}
        />
      )}
    </>
  );
}

export default BaniLengthComponent;
