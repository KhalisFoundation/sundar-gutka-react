import React, { useEffect, useState, useMemo } from "react";
import { View, Image, Linking, Text, Pressable } from "react-native";
import {
  constant,
  logMessage,
  actions,
  checkForBaniDBUpdate,
  logError,
  StatusBarComponent,
  SafeArea,
  colors,
} from "@common";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import CheckUpdatesAnimation from "./components/checkUpdate";
import BaniDBAbout from "./components/baniDBAbout";
import styles from "./styles";
import DownloadComponent from "./components/Download";
import useHeader from "./hooks/useHeader";
import { darkMode } from "./components/styles";

const DatabaseUpdateScreen = ({ navigation }) => {
  logMessage(constant.DATABASE_UPDATE_SCREEN);
  const baniDBLogoFull = require("../../images/banidblogo.png");
  const [isLoading, setIsLoading] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const isNightMode = useSelector((state) => state.isNightMode);
  useHeader(navigation, isNightMode);
  const dispatch = useDispatch();
  const { darkModeContainer, darkModeText } = useMemo(() => darkMode(isNightMode), [isNightMode]);

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
    <SafeArea backgroundColor={colors.BANIDB_LIGHT}>
      <StatusBarComponent backgroundColor={colors.BANIDB_LIGHT} />
      <View style={[styles.mainWrapper, darkModeContainer]}>
        <CheckUpdatesAnimation isLoading={isLoading} isUpdateAvailable={isUpdateAvailable} />
        {!isLoading && isUpdateAvailable && <DownloadComponent />}
        <Pressable onPress={() => Linking.openURL(constant.BANI_DB_URL)}>
          <View style={styles.baniDBContainer}>
            <Image source={baniDBLogoFull} style={styles.baniDBImage} />
            <Text style={[styles.baniDBText, darkModeText]}>BaniDB</Text>
          </View>
        </Pressable>
        <BaniDBAbout />
      </View>
    </SafeArea>
  );
};

DatabaseUpdateScreen.propTypes = { navigation: PropTypes.shape().isRequired };

export default DatabaseUpdateScreen;
