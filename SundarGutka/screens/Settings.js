import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Header } from "react-native-elements";
import SettingsList from 'react-native-settings-list';

export default class Settings extends React.Component {
  constructor(){
    super();
    this.onValueChange = this.onValueChange.bind(this);
    this.state = {switchValue: false};
  }
  render() {
    var bgColor = '#DCE3F4';
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            <SettingsList.Header headerText='Different Grouping' headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={
                  <Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>
              }
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Airplane Mode'
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Wi-Fi'
              titleInfo='Bill Wi The Science Fi'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Blutooth'
              titleInfo='Off'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Cellular'
              onPress={() => Alert.alert('Route To Cellular Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Personal Hotspot'
              titleInfo='Off'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route To Hotspot Page')}
            />
            <SettingsList.Header headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Notifications'
              onPress={() => Alert.alert('Route To Notifications Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Control Center'
              onPress={() => Alert.alert('Route To Control Center Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Do Not Disturb'
              onPress={() => Alert.alert('Route To Do Not Disturb Page')}
            />
            <SettingsList.Header headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='General'
              onPress={() => Alert.alert('Route To General Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='Display & Brightness'
              onPress={() => Alert.alert('Route To Display Page')}
            />
          </SettingsList>
        </View>
      </View>
    );
  }
  onValueChange(value){
    this.setState({switchValue: value});
  }
}

const styles = StyleSheet.create({
  imageStyle:{
    marginLeft:15,
    marginRight:20,
    alignSelf:'center',
    width:20,
    height:24,
    justifyContent:'center'
  }
});
