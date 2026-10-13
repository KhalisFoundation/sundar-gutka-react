import React, { useEffect, useRef, useState } from "react";
import { View, Image, Linking, Pressable } from "react-native";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import useTokens from "@common/hooks/useTokens";
import {
  constant,
  actions,
  StatusBarComponent,
  SafeArea,
  GradientDivider,
  CustomText,
  STRINGS,
  useNetwork,
} from "@common";
import { ScreenHeader } from "../common/components/ui";
import BaniDBAbout from "./components/baniDBAbout";
import CheckUpdatesAnimation from "./components/checkUpdate";
import DownloadComponent from "./components/Download";
import createStyles from "./styles";
import { resolveUpdateCheck, UPDATE_CHECK } from "./updateCheck";

const DatabaseUpdateScreen = ({ navigation }) => {
  const { c } = useTokens();
  const styles = useThemedStyles(createStyles);
  const baniDBLogoFull = require("../../images/banidblogo.png");
  const [isLoading, setIsLoading] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const dispatch = useDispatch();
  const { isOnline } = useNetwork();
  // The answer this screen holds. Once it is a real one, a connection change
  // has nothing to add — and re-checking would unmount a download already
  // under way (the loading state hides <DownloadComponent />).
  const outcomeRef = useRef(null);
  // Which check owns the screen. A newer check, or leaving the screen,
  // supersedes an older one still in flight, so results never land out of order.
  const requestRef = useRef(0);

  const checkForUpdates = async () => {
    requestRef.current += 1;
    const request = requestRef.current;
    setIsLoading(true);
    const outcome = await resolveUpdateCheck({ isOnline });
    if (request !== requestRef.current) return;
    outcomeRef.current = outcome;
    const available = outcome === UPDATE_CHECK.AVAILABLE;
    setIsOffline(outcome === UPDATE_CHECK.OFFLINE);
    setIsFailed(outcome === UPDATE_CHECK.FAILED);
    setIsUpdateAvailable(available);
    setIsLoading(false);
    // Only a real answer moves the Home badge. Offline or a failed request
    // says nothing about the database, and clearing the badge there would hide
    // a known update until the background check's 24-hour cooldown ran out.
    if (outcome === UPDATE_CHECK.AVAILABLE || outcome === UPDATE_CHECK.UP_TO_DATE) {
      dispatch(actions.toggleDatabaseUpdateAvailable(available));
    }
  };
  // Re-run when the connection changes only while the screen has no real
  // answer yet (first open, offline, or a failed request), so a phone that
  // opened this screen offline gets its answer without leaving and returning.
  useEffect(() => {
    const answered =
      outcomeRef.current === UPDATE_CHECK.AVAILABLE ||
      outcomeRef.current === UPDATE_CHECK.UP_TO_DATE;
    if (!answered) checkForUpdates();
  }, [isOnline]);
  // A check still in flight when the screen closes must not set state.
  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    []
  );

  return (
    <SafeArea backgroundColor={c.background} edges={["bottom"]}>
      <StatusBarComponent backgroundColor={c.background} />
      <ScreenHeader
        title={STRINGS.databaseUpdate}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
      />
      <GradientDivider />
      <View style={styles.mainWrapper}>
        <CheckUpdatesAnimation
          isLoading={isLoading}
          isUpdateAvailable={isUpdateAvailable}
          isOffline={isOffline}
          isFailed={isFailed}
        />
        {!isLoading && isUpdateAvailable && <DownloadComponent />}
        <Pressable onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
          <View style={styles.baniDBContainer}>
            <Image source={baniDBLogoFull} style={styles.baniDBImage} />
            <CustomText style={styles.baniDBText}>{STRINGS.BANI_DB}</CustomText>
          </View>
        </Pressable>
        <BaniDBAbout />
      </View>
    </SafeArea>
  );
};

DatabaseUpdateScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default DatabaseUpdateScreen;
