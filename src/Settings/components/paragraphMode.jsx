import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { toggleParagraphMode } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, ListItemTitle } from "@common";
import createStyles from "../styles";

const ParagraphMode = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);

  const dispatch = useDispatch();
  const { PARAGRAPH_MODE } = STRINGS;
  return (
    <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
      <Icon color={theme.colors.primaryText} name="view-headline" size={30} />
      <ListItem.Content>
        <ListItemTitle title={PARAGRAPH_MODE} style={styles.listItemTitle} />
      </ListItem.Content>
      <Switch
        value={isParagraphMode}
        onValueChange={(value) => dispatch(toggleParagraphMode(value))}
      />
    </ListItem>
  );
};
export default ParagraphMode;
