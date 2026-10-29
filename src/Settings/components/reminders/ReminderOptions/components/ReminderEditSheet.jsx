import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { withScreenRoles } from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import { setReminderBanis } from "@common/actions";
import { NEST_OVERLAYS_IN_SHEET } from "@common/components/ui/Overlay";
import useTokens from "@common/hooks/useTokens";
import { reminderTitle } from "@common/reminders/title";
import {
  ConfirmDialogHost,
  constant,
  showConfirm,
  STRINGS,
  trackReminderEvent,
  scheduleReminders,
} from "@common";
import { Row, Sheet, TimePickerSheet } from "../../../../../common/components/ui";
import LabelModal from "../modals/LabelModal";

// Everything you can do to one reminder, in the app's own sheet: change its
// time, rename its notification, delete it.
//
// ── The time picker and the label prompt are rendered INSIDE the sheet ──────
//
// Not beside it. Both are Modals, and so is the sheet, and on iOS a Modal is a
// real UIViewController presented by whichever view controller React resolves
// for the view that hosts it:
//
//   [[modalHostView reactViewController] presentViewController:...]
//                                     (RCTModalHostViewManager.m)
//
// `reactViewController` walks up the react superview chain. As SIBLINGS of the
// sheet these two resolved to the ROOT controller — which is already presenting
// the sheet — and UIKit refuses to present twice from the same controller
// ("Attempt to present ... which is already presenting"). The tap did nothing,
// the completion never ran, and the screen sat there looking frozen. Android
// never had the bug: a Modal is a Dialog there, and dialogs simply stack.
//
// As children the chain ends at the sheet's own RCTModalHostViewController, so
// the picker is presented BY the sheet, which is what iOS requires.
//
// The same trap catches anything else opened from in here, which is why the
// Delete row's confirm gets a `ConfirmDialogHost` of its own at the bottom of
// the sheet — the app-root host it would otherwise reach is presented by the
// root controller and could not open over this sheet.
//
// This replaces the accordion's expanded panel — two untitled icon rows on a
// navy slab. A sheet is the right shape for it: the list stays a stable height,
// the actions are named rather than guessed from an icon, and it matches every
// other chooser in Settings.
const ReminderEditSheet = ({ section = null, visible, onClose }) => {
  const { c, layout } = useTokens();
  const dispatch = useDispatch();
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const isTransliteration = useSelector((state) => state.isTransliteration);

  const [isTimePicker, toggleTimePicker] = useState(false);
  const [isLabelModal, toggleLabelModal] = useState(false);

  if (!section) return null;
  const { key, time } = section;
  // Resolved here rather than read off the stored title, so the heading follows
  // the transliteration setting the same way the home bani list does. A title
  // the user typed is returned untouched.
  const title = reminderTitle(section, isTransliteration);

  const handleTimePicked = (formattedTime) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(key));
    if (targetIndex !== -1) {
      array[targetIndex] = {
        ...array[targetIndex],
        enabled: true,
        time: formattedTime,
      };
    }
    dispatch(setReminderBanis(JSON.stringify(array)));
    toggleTimePicker(false);
    scheduleReminders(isReminders, reminderSound, JSON.stringify(array), isTransliteration);
    trackReminderEvent(constant.UPDATE_REMINDER, array[targetIndex]);
    onClose();
  };

  const handleDelete = () =>
    showConfirm({
      title: STRINGS.delete,
      message: title,
      cancelText: STRINGS.cancel,
      confirmText: STRINGS.delete,
      destructive: true,
      onConfirm: () => {
        const arr = JSON.parse(reminderBanis).filter((obj) => obj.key !== key);
        dispatch(setReminderBanis(JSON.stringify(arr)));
        // Rewrite the OS schedule too. Without this the reminder vanished from
        // the list but its notification stayed registered and kept firing —
        // deleting it only ever changed the app's own copy.
        scheduleReminders(isReminders, reminderSound, JSON.stringify(arr), isTransliteration);
        onClose();
      },
    });

  // Written once and placed in one of two positions — see
  // NEST_OVERLAYS_IN_SHEET. Neither adds anything to the layout wherever it
  // lands: React Native renders a Modal's inline view `position: "absolute"`
  // (Modal.js, `styles.modal`), so it is out of flow either way.
  const overlays = (
    <>
      <TimePickerSheet
        visible={isTimePicker}
        value={time}
        title={STRINGS.REMINDER_TIME}
        confirmLabel={STRINGS.ok}
        cancelLabel={STRINGS.cancel}
        hourLabel={STRINGS.HOUR}
        minuteLabel={STRINGS.MINUTE}
        editHint={STRINGS.TIME_EDIT_HINT}
        onConfirm={handleTimePicked}
        onClose={() => toggleTimePicker(false)}
      />

      {isLabelModal && <LabelModal section={section} onHide={() => toggleLabelModal(false)} />}

      {/* iOS only. `showConfirm`'s host is normally the one at the app root,
          which there is presented by the root controller — already presenting
          this sheet — so the dialog never appeared. A host mounted inside
          registers as the innermost and takes over while the sheet is open.
          Android needs none of it: the root host opens a Dialog that stacks
          over the sheet, which is what it did before. */}
      {NEST_OVERLAYS_IN_SHEET && <ConfirmDialogHost />}
    </>
  );

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={title}
        closeAccessibilityLabel={STRINGS.cancel}
      >
        <Row
          title={STRINGS.REMINDER_TIME}
          value={time}
          onPress={() => toggleTimePicker(true)}
          showDivider
          leading={<Icon name="schedule" color={c.textSecondary} size={layout.icon.sm} />}
        />
        <Row
          title={STRINGS.notification_text}
          onPress={() => toggleLabelModal(true)}
          showDivider
          leading={<Icon name="turned-in-not" color={c.textSecondary} size={layout.icon.sm} />}
        />
        <Row
          title={STRINGS.delete}
          onPress={handleDelete}
          titleStyle={{ color: c.error }}
          leading={<Icon name="delete-outline" color={c.error} size={layout.icon.sm} />}
        />

        {NEST_OVERLAYS_IN_SHEET && overlays}
      </Sheet>
      {!NEST_OVERLAYS_IN_SHEET && overlays}
    </>
  );
};

ReminderEditSheet.propTypes = {
  section: PropTypes.shape({
    key: PropTypes.number.isRequired,
    time: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// The sheet carries its own palette rather than taking the host screen's. It
// opens from the reminders screen, which is Settings-scoped, and from the
// Dashboard, which is not; unscoped, the same sheet, its time picker and its
// label prompt came out in the neutral greys in dark mode instead of the
// Settings navy. Scoped here, outside the component, so the icon colours it
// reads itself follow too — the same rule Sheet's own scope is written to.
export default withScreenRoles(ReminderEditSheet, "settings");
