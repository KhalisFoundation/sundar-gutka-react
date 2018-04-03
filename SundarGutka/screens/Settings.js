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
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            <SettingsList.Header headerText='Display Options' headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={
                  <Image style={styles.imageStyle} source={require('../images/fontsizeicon.png')}/>
              }
              title='Font Size'
              titleInfo='Medium'
              titleInfoStyle={styles.titleInfoStyle}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/fontfaceicon.png')}/>}
              title='Font Face'
              titleInfo='Gurbani Akhar'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/romanizeicon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Romanized'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/englishicon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='English Translations'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/bgcoloricon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Night Mode'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Header headerText='Phone Options' headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/screenonicon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Keep Screen Awake'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Header headerText='Bani Options' headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/rearrangeicon.png')}/>}
              title='Edit Bani Order'
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/banilengthicon.png')}/>}
              title='Bani Length'
              titleInfo='Long (Default)'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/larivaaricon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Larivaar'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/manglacharanicon.png')}/>}
              title='Manglacharan Position'
              titleInfo='Current Saroops (default)'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/larivaaricon.png')}/>}
              title='Padchhed Settings'
              titleInfo='Sat Subham Sat (default)'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Header headerText='Other Options' headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/analyticsicon.png')}/>}
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Collect Statistics'
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              icon={<Image style={styles.imageStyle} source={require('../images/abouticon.png')}/>}
              title='About'
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
          </SettingsList>
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
    marginRight:10,
    alignSelf:'center',
    width:28,
    height:28,
    justifyContent:'center'
  },
  titleInfoStyle:{
    marginLeft:15
  }
});
