import React, { useState, useCallback, useEffect } from "react";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { TouchableOpacity, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useHeader from "./hooks/useHeader";
import { activeColor, nightStyles, styles } from "./styles";
import { setBaniList, setBaniOrder } from "../common/actions";
import { fetchDefaultBaniOrder } from "../common/components/BaniList/baniOrderHelper";

function EditBaniOrder({ navigation }) {
  const { baniList, isNightMode } = useSelector((state) => state);
  useHeader(navigation);
  const [data, setData] = useState(baniList);
  const { rowItem, text, gestureBackColor } = styles;
  const dispatch = useDispatch();
  const defaultOrder = fetchDefaultBaniOrder();
  const nightColor = nightStyles(isNightMode);

  const renderItem = useCallback(({ item, drag, isActive }) => {
    const activeStyle = activeColor(isActive, item.backgroundColor);
    return (
      <ShadowDecorator>
        <ScaleDecorator>
          <TouchableOpacity
            key={item.id}
            activeOpacity={1}
            onLongPress={drag}
            disabled={isActive}
            style={activeStyle}
          >
            <View style={[rowItem, nightColor.backColor]}>
              <Text style={[text, nightColor.textColor]}>{item.gurmukhi}</Text>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
      </ShadowDecorator>
    );
  }, []);

  useEffect(() => {
    setData(baniList);
  }, [baniList]);

  const handleDragEnd = (newOrder) => {
    const ids = newOrder.data.map((item) => {
      return { id: item.id };
    });
    setData(newOrder.data);
    const newOrderIds = ids.map((id, index) => {
      return ids[index].id !== undefined ? ids[index] : defaultOrder.baniOrder[index];
    });
    dispatch(setBaniOrder({ baniOrder: newOrderIds }));
    dispatch(setBaniList(newOrder.data));
  };
  return (
    <GestureHandlerRootView style={gestureBackColor}>
      <DraggableFlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={(nextOrder) => {
          handleDragEnd(nextOrder);
        }}
      />
    </GestureHandlerRootView>
  );
}
EditBaniOrder.propTypes = { navigation: PropTypes.shape().isRequired };
export default EditBaniOrder;
