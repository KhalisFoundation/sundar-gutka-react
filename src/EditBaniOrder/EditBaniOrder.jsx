import React, { useState, useCallback, useEffect } from "react";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch, batch } from "react-redux";
import PropTypes from "prop-types";
import useHeader from "./hooks/useHeader";
import { activeColor, nightStyles, styles } from "./styles";
import { setBaniList, setBaniOrder } from "../common/actions";

function EditBaniOrder({ navigation }) {
  const { isNightMode } = useSelector((state) => state.isNightMode);
  const { baniList } = useSelector((state) => state.baniList);
  useHeader(navigation);
  const [baniListdata, setBaniListData] = useState(
    baniList.filter((item) => item.id !== undefined)
  );
  const [orderData, setOrderData] = useState([]);
  const { rowItem, text, gestureBackColor } = styles;
  const dispatch = useDispatch();
  const nightColor = nightStyles(isNightMode);

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
    batch(() => {
      dispatch(setBaniList(baniListdata));
      dispatch(setBaniOrder({ baniOrder: orderData }));
    });
  }, [baniListdata, orderData]);

  const handleDragEnd = ({ data }) => {
    const ids = data.map((item) => {
      return { id: item.id };
    });
    setBaniListData(data);
    setOrderData(ids);
  };
  return (
    <GestureHandlerRootView style={gestureBackColor}>
      <DraggableFlatList
        data={baniListdata}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
      />
    </GestureHandlerRootView>
  );
}
EditBaniOrder.propTypes = {
  navigation: PropTypes.shape({ goBack: PropTypes.func.isRequired }).isRequired,
};
export default EditBaniOrder;
