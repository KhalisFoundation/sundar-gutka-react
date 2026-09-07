import React, { useState } from "react";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import STRINGS from "@common/localization";
import { READER_COLOR_KEYS } from "@theme/readerColors";
import { ListItemComponent } from "../comon";
import ColorEditor from "./ColorEditor";

const ReaderColors = ({ initialColor = "background" }) => {
  const { theme } = useTheme();
  const [editingMode, setEditingMode] = useState(null);
  return (
    <>
      <ListItemComponent
        icon="palette"
        title={STRINGS.reader_colors}
        value=""
        isAvatar={false}
        actionConstant={[]}
        onPressAction={() => setEditingMode(theme.mode)}
      />
      {editingMode && (
        <ColorEditor
          mode={editingMode}
          initialColor={initialColor}
          onClose={() => setEditingMode(null)}
        />
      )}
    </>
  );
};

ReaderColors.propTypes = { initialColor: PropTypes.oneOf(READER_COLOR_KEYS) };
ReaderColors.defaultProps = { initialColor: "background" };

export default ReaderColors;
