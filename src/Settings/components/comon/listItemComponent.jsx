import React from "react";
import PropTypes from "prop-types";
import SettingsRow from "./SettingsRow";

// A setting that opens a bottom sheet to choose from a list. Now a thin adapter
// over `SettingsRow`, so it shares its height, padding, divider and press state
// with every other row in the app.
//
// `icon` arrives as a stringified `require()` id (the callers pass
// `icon.toString()`), so it is coerced back to a number for <Image>.
const ListItemComponent = ({
  icon,
  title,
  value,
  isAvatar,
  tintIcon = true,
  actionConstant,
  onPressAction,
}) => {
  const selected = actionConstant.find((item) => item.key === value);

  return (
    <SettingsRow
      title={title}
      value={selected?.title}
      icon={isAvatar ? undefined : icon}
      iconImage={isAvatar ? Number(icon) : undefined}
      tintIcon={tintIcon}
      onPress={onPressAction}
    />
  );
};

ListItemComponent.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isAvatar: PropTypes.bool.isRequired,
  tintIcon: PropTypes.bool,
  actionConstant: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  onPressAction: PropTypes.func.isRequired,
};

export default ListItemComponent;
