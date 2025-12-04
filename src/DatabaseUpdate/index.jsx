import React, { useEffect, useState } from "react";
import { View, Image, Linking, Pressable } from "react-native";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  constant,
  actions,
  checkForBaniDBUpdate,
  logError,
  StatusBarComponent,
  SafeArea,
  CustomText,
} from "@common";
import BaniDBAbout from "./components/baniDBAbout";
import CheckUpdatesAnimation from "./components/checkUpdate";
import DownloadComponent from "./components/Download";
import useHeader from "./hooks/useHeader";
import createStyles from "./styles";

const DatabaseUpdateScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const baniDBLogoFull = require("../../images/banidblogo.png");
  const [isLoading, setIsLoading] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  useHeader(navigation);
  const dispatch = useDispatch();

  const checkForUpdates = async () => {
    try {
      setIsLoading(true);
      const needUpdate = await checkForBaniDBUpdate();
      setIsUpdateAvailable(needUpdate);
      setIsLoading(false);
      dispatch(actions.toggleDatabaseUpdateAvailable(needUpdate));
    } catch (error) {
      dispatch(actions.toggleDatabaseUpdateAvailable(false));
      logError(error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <SafeArea backgroundColor={theme.colors.baniDB}>
      <StatusBarComponent backgroundColor={theme.colors.baniDB} />
      <View style={styles.mainWrapper}>
        <CheckUpdatesAnimation isLoading={isLoading} isUpdateAvailable={isUpdateAvailable} />
        {!isLoading && isUpdateAvailable && <DownloadComponent />}
        <Pressable onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
          <View style={styles.baniDBContainer}>
            <Image source={baniDBLogoFull} style={styles.baniDBImage} />
            <CustomText style={styles.baniDBText}>BaniDB</CustomText>
          </View>
        </Pressable>
        <BaniDBAbout />
      </View>
    </SafeArea>
  );
};

DatabaseUpdateScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default DatabaseUpdateScreen;
