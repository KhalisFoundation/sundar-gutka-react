import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import BaniList from "../common/components/BaniList/BaniList";
import useKeepAwake from "../common/hooks/keepAwake";
import { getBaniList } from "../database/db";
import STRINGS from "../common/localization";
import colors from "../common/colors";
import styles from "./styles";
import constant from "../common/constant";
import BaniLengthSelector from "../common/components/BaniLengthSelector";
import { setBaniList } from "../common/actions";
import { oderedBani } from "../common/components/BaniList/baniOrderHelper";

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
  const { transliterationLanguage, isNightMode, baniLength, isStatusBar } = useSelector(
    (state) => state
  );
  const [baniLengthSelector, toggleBaniLengthSelector] = useState(false);
  const { navigate } = navigation;
  const [data, setData] = useState([]);
  useKeepAwake();

  function onPress(row) {
    const bani = row.item;
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: { id: bani.id, title: bani.gurmukhi },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.roman}`,
        params: { data: bani.folder, title: bani.gurmukhi },
      });
    }
  }

  useEffect(() => {
    if (baniLength === "") {
      toggleBaniLengthSelector(true);
    }
  }, []);
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
      <StatusBar
        hidden={isStatusBar}
        barStyle="light-content"
        backgroundColor={colors.TOOLBAR_COLOR}
      />
      <BaniHeader navigate={navigate} />

      {baniLengthSelector && <BaniLengthSelector />}
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
