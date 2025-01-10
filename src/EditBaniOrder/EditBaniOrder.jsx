import React, { useState, useCallback, useEffect } from "react";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch, batch } from "react-redux";
import PropTypes from "prop-types";
import { STRINGS, defaultBaniOrder, actions } from "@common";
import { activeColor, nightStyles, styles } from "./styles";
import useHeader from "./hooks/useHeader";

const EditBaniOrder = ({ navigation }) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const baniList = useSelector((state) => state.baniList);
  const baniOrder = useSelector((state) => state.baniOrder);
  const language = useSelector((state) => state.language);
  const [isReset, setReset] = useState(false);

  const [baniListData, setBaniListData] = useState(
    baniList.filter((item) => item.id !== undefined)
  );

  const [folders] = useState(baniList.filter((item) => item.id === undefined));
  const [folderOrderIds] = useState(baniOrder.baniOrder.filter((item) => item.id === undefined));
  const [orderData, setOrderData] = useState(
    baniOrder.baniOrder.filter((item) => item.id !== undefined)
  );

  useHeader(navigation, setReset);
  const { rowItem, text } = styles;
  const dispatch = useDispatch();
  const nightColor = nightStyles(isNightMode);
  useEffect(() => {
    navigation.setOptions({
      title: STRINGS.EDIT_BANI_ORDER,
    });
  }, [language]);

  const renderItem = useCallback(
    ({ item, drag, isActive }) => {
      const activeStyle = activeColor(isActive, item.backgroundColor);
      return (
        <ShadowDecorator>
          <ScaleDecorator>
            <Pressable activeOpacity={1} onLongPress={drag} disabled={isActive} style={activeStyle}>
              <View key={item.id} style={[rowItem, nightColor.backColor]}>
                <Text style={[nightColor.textColor, text]}>{item.gurmukhi}</Text>
              </View>
            </Pressable>
          </ScaleDecorator>
        </ShadowDecorator>
      );
    },
    [rowItem, nightColor, text]
  );

  useEffect(() => {
    if (!isReset) {
      return;
    }
    dispatch(actions.setBaniOrder({ baniOrder: defaultBaniOrder.baniOrder }));
    const banis = [];
    if (
      defaultBaniOrder &&
      Array.isArray(defaultBaniOrder.baniOrder) &&
      defaultBaniOrder.baniOrder.length > 0
    ) {
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
    }

    setOrderData(defaultBaniOrder.baniOrder.filter((item) => item.id !== undefined));
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
    <GestureHandlerRootView style={nightColor.viewBackColor}>
      <DraggableFlatList
        data={baniListData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
      />
    </GestureHandlerRootView>
  );
};
EditBaniOrder.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default EditBaniOrder;
