import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { withAlpha } from "@theme/colorUtils";
import PropTypes from "prop-types";
import { setReminderBanis } from "@common/actions";
import Overlay from "@common/components/ui/Overlay";
import useTokens from "@common/hooks/useTokens";
import { logError, scheduleReminders, STRINGS } from "@common";
import { Button, Text } from "../../../../../common/components/ui";

// Renames the text a reminder's notification shows.
//
// Was a bare Modal with a hardcoded white card (`staticColors.WHITE_COLOR` —
// white in BOTH themes, so black-on-white in dark mode), a `width: "90%"` box,
// an input outlined in `underlayColor` (#009bff, the same blue that failed
// contrast elsewhere), and two untitled `TouchableOpacity` labels with a
// `marginRight: 30` gap. It now uses the same shape as the `Dialog` primitive:
// scrim, elevated surface, dialog padding, and real Buttons that wrap rather
// than truncate when a translation runs long.
// About what a notification title shows before either platform cuts it off.
// Enforced in the field itself, so there is never anything to reject later.
export const MAX_TITLE_LENGTH = 60;

// What is actually stored: runs of whitespace — including pasted line breaks,
// which a single-line field cannot show — become one space, and the ends are
// trimmed. Empty after that means there is nothing worth saving.
export const cleanTitle = (raw) =>
  String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);

const LabelModal = ({ section, onHide }) => {
  const { c, space, layout, radii, elevation } = useTokens();
  const { title } = section;
  const [reminderTitle, setReminderTitle] = useState(title);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const dispatch = useDispatch();

  const cleanedTitle = cleanTitle(reminderTitle);
  // A blank title would fire as a notification with no title at all, and sit
  // in the list as an empty line. OK stays dead until there is something to
  // save; the guard below is for a submit that bypasses the button.
  const canSave = cleanedTitle.length > 0;

  const confirmReminderLabel = () => {
    if (!canSave) return;
    const array = JSON.parse(reminderBanis);
    const index = array.findIndex((item) => item.key === section.key);
    // `titleCustom` is what tells the list to show this text in place of the
    // bani name. A flag rather than comparing against the default wording, so
    // a later language change cannot make an untouched title look customised.
    if (index !== -1) array[index] = { ...array[index], title: cleanedTitle, titleCustom: true };
    dispatch(setReminderBanis(JSON.stringify(array)));
    // The title is saved by the dispatch above; a failed reschedule must not
    // surface as an unhandled rejection that looks like the save failed.
    scheduleReminders(isReminders, reminderSound, JSON.stringify(array), isTransliteration).catch(
      logError
    );
    onHide();
  };

  return (
    <Overlay animationType="fade" onRequestClose={onHide}>
      <View
        style={{
          flex: 1,
          backgroundColor: c.scrim,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: layout.dialog.marginHorizontal,
        }}
      >
        <View
          accessibilityViewIsModal
          style={[
            {
              width: "100%",
              maxWidth: layout.dialog.maxWidth,
              backgroundColor: c.surfaceElevated,
              borderRadius: radii.xl,
              padding: layout.dialog.padding,
              gap: layout.dialog.gap,
            },
            elevation.overlay,
          ]}
        >
          <Text variant="subheading">{STRINGS.notification_text}</Text>

          <TextInput
            value={reminderTitle}
            onChangeText={setReminderTitle}
            maxLength={MAX_TITLE_LENGTH}
            returnKeyType="done"
            onSubmitEditing={confirmReminderLabel}
            autoFocus
            selectTextOnFocus
            // The whole title is selected on open so a replacement can be typed
            // straight away — which put an OPAQUE accent block over the text
            // and hid it until the selection was tapped away. Translucent, the
            // text stays readable through the highlight, on every theme:
            // Android paints this colour as given, iOS already thins its own.
            selectionColor={withAlpha(c.accent, 0.35)}
            placeholderTextColor={c.textDisabled}
            style={{
              minHeight: layout.touchTarget,
              borderRadius: radii.sm,
              borderWidth: layout.borderWidth.hairline,
              borderColor: c.borderStrong,
              paddingHorizontal: space.md,
              color: c.textPrimary,
              backgroundColor: c.surface,
              fontSize: 16,
            }}
          />

          {/* Wraps onto separate lines when a translation is too wide to share
              one — same rule as the Dialog primitive. */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: space.sm,
            }}
          >
            <Button
              title={STRINGS.cancel}
              onPress={onHide}
              variant="ghost"
              style={{ flexGrow: 1, flexBasis: "auto" }}
            />
            <Button
              title={STRINGS.ok}
              onPress={confirmReminderLabel}
              disabled={!canSave}
              style={{ flexGrow: 1, flexBasis: "auto" }}
            />
          </View>
        </View>
      </View>
    </Overlay>
  );
};

LabelModal.propTypes = {
  section: PropTypes.shape({ key: PropTypes.number.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  onHide: PropTypes.func.isRequired,
};

export default LabelModal;
