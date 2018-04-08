import React from "react";
import { StyleSheet, FlatList, Text } from "react-native";
import { connect } from "react-redux";
import Database from "../utils/database";

class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true
    };
  }

  componentWillMount() {
    
  }

  render() {
    const { params } = this.props.navigation.state;
    return (
      <FlatList
        data={params.shabad}
        extraData={[this.state]}
        renderItem={({ item }) => <Text>{item.gurmukhi}</Text>}
        keyExtractor={item => item.seq}
      />
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
    nightMode: state.nightMode
  };
}

export default connect(mapStateToProps)(Reader);
