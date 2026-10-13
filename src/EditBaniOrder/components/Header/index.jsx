import React from "react";
import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { RefreshIcon } from "@common/icons";
import { GradientDivider, showConfirm, STRINGS } from "@common";
import { ScreenHeader } from "../../../common/components/ui";

// Was a hand-rolled navy bar with white icons — the last screen still doing
// that. It is the shared `ScreenHeader` now, so the title, height, back arrow
// and the gradient rule beneath it match every other screen.
const Header = ({ setReset }) => {
  const navigation = useNavigation();
  const { c, layout } = useTokens();

  return (
    <>
      <ScreenHeader
        title={STRINGS.EDIT_BANI_ORDER}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
        actions={
          <Pressable
            // Confirm first. This throws away a custom order the user built by
            // hand, and an unlabelled icon gave no hint that was about to
            // happen — one mis-tap and the arrangement was gone.
            onPress={() =>
              showConfirm({
                title: STRINGS.RESET_ORDER_TITLE,
                message: STRINGS.RESET_ORDER_BODY,
                cancelText: STRINGS.cancel,
                confirmText: STRINGS.reset,
                destructive: true,
                onConfirm: () => setReset(true),
              })
            }
            accessibilityRole="button"
            accessibilityLabel={STRINGS.reset}
            hitSlop={layout.hitSlop}
            style={({ pressed }) => ({
              width: layout.header.actionSize,
              height: layout.header.actionSize,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <RefreshIcon size={layout.header.iconSize} color={c.headerFg} />
          </Pressable>
        }
      />
      <GradientDivider />
    </>
  );
};

Header.propTypes = {
  setReset: PropTypes.func.isRequired,
};

export default Header;
