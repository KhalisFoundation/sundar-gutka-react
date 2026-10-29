import React from "react";
import { Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { GradientDivider, showConfirm, STRINGS } from "@common";
import { ScreenHeader } from "../../../../../common/components/ui";
import setDefaultReminders from "../utils";

// Replaces the `useHeader` hook that drove the navigator's own header. That was
// the last screen in the app still doing so: a green bar (`colors.headerVariant`)
// with fixed white icons, which matched nothing else and ignored the theme.
//
// Same two actions as before — reset to defaults, and add a bani — now in the
// shared header's actions slot. Reset asks first: it replaces every reminder the
// user has set, and an unlabelled circular arrow gave no hint of that.
const Header = ({ baniListData, navigation, onAdd }) => {
  const { c, layout, space } = useTokens();
  const dispatch = useDispatch();
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const isTransliteration = useSelector((state) => state.isTransliteration);

  const action = (name, label, onPress) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={layout.hitSlop}
      style={({ pressed }) => ({
        width: layout.header.actionSize,
        height: layout.header.actionSize,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} size={layout.header.iconSize} color={c.headerFg} />
    </Pressable>
  );

  return (
    <>
      <ScreenHeader
        title={STRINGS.set_reminder_options}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
        actions={
          baniListData.length > 0 ? (
            <View style={{ flexDirection: "row", gap: space.xs }}>
              {action("refresh", STRINGS.reset_reminders, () =>
                showConfirm({
                  title: STRINGS.reset_reminders,
                  message: STRINGS.reset_reminder_text,
                  cancelText: STRINGS.cancel,
                  confirmText: STRINGS.reset,
                  destructive: true,
                  onConfirm: () =>
                    setDefaultReminders(
                      baniListData,
                      dispatch,
                      isReminders,
                      reminderSound,
                      isTransliteration
                    ),
                })
              )}
              {action("add", STRINGS.ADD_BANI, onAdd)}
            </View>
          ) : null
        }
      />
      <GradientDivider />
    </>
  );
};

Header.propTypes = {
  baniListData: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  navigation: PropTypes.shape({ goBack: PropTypes.func.isRequired }).isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default Header;
