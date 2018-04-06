import React from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { List, ListItem } from "react-native-elements";
import { connect } from "react-redux";

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: []
    };
  }

  reorder(arr, index) {
    var temp = new Array(index.length);

    // arr[i] should be present at index[i] index
    for (var i = 0; i < index.length; i++) {
      temp[index[i]] = arr[i];
    }
    // Copy temp[] to arr[]
    for (var i = 0; i < index.length; i++) {
      arr[i] = temp[i];
    }

    return arr;
  }

  componentWillMount() {
    this.state.data = this.reorder(this.props.mergedBaniData.baniOrder, this.props.baniOrder);
  }

  render() {
    return (
      <List style={styles.container}>
        <FlatList
          data={this.state.data}
          renderItem={({ item }) => <ListItem title={item.gurmukhi} />}
          keyExtractor={item => item.gurmukhi}
        />
      </List>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
    romanized: state.romanized,
    fontSize: state.fontSize,
    fontFace: state.fontFace
  };
}

export default connect(mapStateToProps)(Home);
