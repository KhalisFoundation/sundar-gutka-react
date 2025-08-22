import React, { useState, useCallback, useEffect } from "react";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch, batch } from "react-redux";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import PropTypes from "prop-types";
import {
  defaultBaniOrder,
  actions,
  constant,
  logMessage,
  SafeArea,
  StatusBarComponent,
} from "@common";
import { activeColor, createStyles } from "./styles";
import Header from "./components/Header";

const EditBaniOrder = ({ navigation }) => {
  logMessage(constant.EDIT_BANI_ORDER);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const [isReset, setReset] = useState(false);

  const [baniListData, setBaniListData] = useState(
    baniList.filter((item) => item.id !== undefined)
  );

  const [folders] = useState(baniList.filter((item) => item.id === undefined));
  const [folderOrderIds] = useState(baniOrder.baniOrder.filter((item) => item.id === undefined));
  const [orderData, setOrderData] = useState(
    baniOrder.baniOrder.filter((item) => item.id !== undefined)
  );

  const { rowItem, text } = styles;
  const dispatch = useDispatch();

  const renderItem = useCallback(
    ({ item, drag, isActive }) => {
      const activeStyle = activeColor(isActive, item.backgroundColor, theme);
      return (
        <ShadowDecorator>
          <ScaleDecorator>
            <Pressable activeOpacity={1} onLongPress={drag} disabled={isActive} style={activeStyle}>
              <View key={item.id} style={rowItem}>
                <Text style={text}>{item.gurmukhi}</Text>
              </View>
            </Pressable>
          </ScaleDecorator>
        </ShadowDecorator>
      );
    },
    [rowItem, text]
  );

  useEffect(() => {
    if (!isReset) {
      return;
    }
    dispatch(actions.setBaniOrder({ baniOrder: defaultBaniOrder.baniOrder }));
    const banis = [];
    if (defaultBaniOrder?.baniOrder?.length > 0) {
      defaultBaniOrder.baniOrder.forEach((element) => {
        if (element.id) {
          const baniItem = baniList.find((item) => item.id === element.id);
          if (baniItem) {
            banis.push({
              id: baniItem.id,
              gurmukhi: baniItem.gurmukhi,
              translit: baniItem.translit,
            });
          }
        }
      });
      setOrderData(defaultBaniOrder.baniOrder.filter((item) => item.id !== undefined));
    }

    setBaniListData(banis.filter((item) => item.id !== undefined));
    setReset(false);
  }, [isReset]);

  useEffect(() => {
    if (baniListData.length > 0) {
      const newData = [...baniListData, ...folders];
      const newIds = [...orderData, ...folderOrderIds];
      batch(() => {
        dispatch(actions.setBaniList(newData));
        dispatch(actions.setBaniOrder({ baniOrder: newIds }));
      });
    }
  }, [baniListData, orderData]);

  const handleDragEnd = ({ data }) => {
    const ids = data.map((item) => {
      return { id: item.id };
    });
    setBaniListData(data);
    setOrderData(ids);
  };
  return (
    <SafeArea backgroundColor={theme.colors.headerVariant}>
      <StatusBarComponent backgroundColor={theme.colors.headerVariant} />
      <Header navigation={navigation} setReset={setReset} />
      <GestureHandlerRootView style={styles.gestureHandlerRootView}>
        <DraggableFlatList
          data={baniListData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
        />
      </GestureHandlerRootView>
    </SafeArea>
  );
};
EditBaniOrder.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default EditBaniOrder;
