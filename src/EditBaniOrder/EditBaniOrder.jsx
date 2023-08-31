import React, { useState, useCallback } from "react";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
  OpacityDecorator,
} from "react-native-draggable-flatlist";
import { TouchableOpacity, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useHeader from "./hooks/useHeader";
import styles from "./styles";
import { setBaniList, setBaniOrder } from "../common/actions";

function EditBaniOrder({ navigation }) {
  const { baniList } = useSelector((state) => state);
  useHeader(navigation);
  const [data, setData] = useState(baniList);
  const { rowItem, text } = styles;
  const dispatch = useDispatch();

  const renderItem = useCallback(({ item, drag, isActive }) => {
    return (
      <ShadowDecorator>
        <ScaleDecorator>
          <OpacityDecorator>
            <TouchableOpacity
              key={item.id}
              activeOpacity={1}
              onLongPress={drag}
              disabled={isActive}
              style={[rowItem, { backgroundColor: isActive ? "blue" : item.backgroundColor }]}
            >
              <Text style={text}>{item.gurmukhi}</Text>
            </TouchableOpacity>
          </OpacityDecorator>
        </ScaleDecorator>
      </ShadowDecorator>
    );
  }, []);

  const handleDragEnd = (newOrder) => {
    const ids = newOrder.data.map((item) => {
      return { id: item.id };
    });
    setData(newOrder.data);
    console.log("ID's", ids);
    // dispatch(setBaniOrder({ baniOrder: ids }));
    // dispatch(setBaniList(newOrder.data));
  };
  return (
    <GestureHandlerRootView>
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
