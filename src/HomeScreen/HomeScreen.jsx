import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import BaniList from "./components/BaniList";
import { getBaniList } from "../database/db";
import STRINGS from "../common/localization";
import colors from "../common/colors";
import styles from "./styles";
import constant from "../common/constant";
import { useSelector } from "react-redux";
import { BackgroundImage } from "@rneui/base";

function BaniHeader(props) {
  const { navigate } = props;
  return (
    <View style={styles.header}>
      <View>
        {/* <Text style={styles.fateh}>{STRINGS.fateh}</Text> */}
        <Text style={styles.titleContainer}>
          <Text style={styles.headerDesign}>Œ</Text>
          <Text style={styles.headerTitle}> {STRINGS.sg_title} </Text>
          <Text style={styles.headerDesign}>‰</Text>
        </Text>
      </View>
      <View style={styles.settingIcon}>
        <Icon
          name="settings"
          type="material"
          size={35}
          color={colors.TOOLBAR_TINT}
          onPress={() => {
            navigate(constant.SETTINGS);
          }}
        />
      </View>
    </View>
  );
}

function HomeScreen({ navigation }) {
  const { navigate } = navigation;
  const [data, setData] = useState([]);
  const { transliterationLanguage } = useSelector((state) => state);

  useEffect(() => {
    (async () => {
      try {
        const d = await getBaniList(transliterationLanguage);
        setData(d);
      } catch (error) {
        console.log("Error eh wala ", error);
      }
    })();
  }, [transliterationLanguage]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <BaniHeader navigate={navigate} />

      <BaniList data={data} navigate={navigate} />
    </SafeAreaView>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.shape().isRequired,
};
BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default HomeScreen;
