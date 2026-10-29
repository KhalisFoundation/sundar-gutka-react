import React, { useEffect } from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { GradientDivider, SafeArea, StatusBarComponent, STRINGS } from "@common";
import { ScreenHeader } from "../common/components/ui";
import { useBaniList } from "../HomeScreen/hooks";
import CreatePothiSheet from "./components/CreatePothiSheet";
import usePothiActions from "./hooks/usePothiActions";
import PothiList from "./PothiList";

// The My Pothis landing page, reached from Settings.
//
// The same list the Folders tab renders — one `PothiList`, one set of handlers
// (see `usePothiActions`) — so the two entry points cannot drift. The tab is
// the everyday route; this exists because a collection the user builds deserves
// a place of its own in the app's navigation, not only a tab on another screen.
const MyPothisScreen = ({ navigation }) => {
  const { c } = useTokens();
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const { openPothi, onPinLimit, creating, openCreate, closeCreate, onCreated } =
    usePothiActions(navigate);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeArea backgroundColor={c.backgroundAlt} edges={["bottom", "left", "right"]}>
      <StatusBarComponent backgroundColor={c.backgroundAlt} />
      <View style={{ flex: 1, backgroundColor: c.backgroundAlt }}>
        <ScreenHeader
          title={STRINGS.MY_POTHIS}
          showBorder={false}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel={STRINGS.GO_BACK}
        />
        <GradientDivider />
        <PothiList
          baniListData={baniListData}
          onOpenPothi={openPothi}
          onCreatePress={openCreate}
          onPinLimit={onPinLimit}
        />
      </View>
      <CreatePothiSheet
        visible={creating}
        onClose={closeCreate}
        onCreated={onCreated}
        baniListData={baniListData}
      />
    </SafeArea>
  );
};

MyPothisScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
    setOptions: PropTypes.func,
  }).isRequired,
};

export default MyPothisScreen;
