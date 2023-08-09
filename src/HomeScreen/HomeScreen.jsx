import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import BaniList from "../common/components/BaniList/BaniList";
import { getBaniList } from "../database/db";
import STRINGS from "../common/localization";
import colors from "../common/colors";
import styles from "./styles";
import constant from "../common/constant";

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

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const [data, setData] = useState([]);
  const { transliterationLanguage, isNightMode } = useSelector((state) => state);

  function onPress(row) {
    navigate(constant.READER, {
      key: `Reader-${row.item.id}`,
      params: { id: row.item.id, title: row.item.gurmukhi },
    });
  }

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
    <SafeAreaView
      style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.TOOLBAR_COLOR} />
      <BaniHeader navigate={navigate} />

      <BaniList data={data} onPress={onPress.bind(this)} />
    </SafeAreaView>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape().isRequired,
};
BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default HomeScreen;
