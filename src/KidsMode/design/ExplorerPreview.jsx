/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.


import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { Copy, Small, useUI } from './components';
import { rewardById } from './wardrobe';
export function ExplorerPreview({ wardrobe, who, compact = false, tiny = false }) {
  const { t, host, character } = useUI();
  const actor = who ?? character;
  const movement = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false),[playing, setPlaying] = useState(false);
  useEffect(() => {let active = true;void AccessibilityInfo.isReduceMotionEnabled().then((v) => {if (active)
      setReduced(v);});const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);return () => {active = false;sub.remove();movement.stopAnimation();};}, [movement]);
  const action = wardrobe.equipped.action,belonging = rewardById(wardrobe.equipped.belonging);
  useEffect(() => {movement.stopAnimation();movement.setValue(0);setPlaying(false);}, [action, movement]);
  function play() {movement.stopAnimation();movement.setValue(0);setPlaying(true);Animated.sequence([Animated.timing(movement, { toValue: 1, duration: reduced ? 0 : 500, useNativeDriver: false }), Animated.delay(reduced ? 600 : 200), Animated.timing(movement, { toValue: 0, duration: reduced ? 0 : 500, useNativeDriver: false })]).start(() => setPlaying(false));}
  const angle = action === 'listening' ? '7deg' : action === 'helping' ? '-9deg' : '-3deg';
  return <View style={{ alignItems: 'center', gap: 4 }}>
  <Pressable accessible={!compact} accessibilityRole={compact ? undefined : 'button'} accessibilityLabel={`Preview ${rewardById(action)?.name ?? 'character action'}`} onPress={compact ? undefined : play} style={{ width: tiny ? 62 : compact ? 110 : 150, height: tiny ? 78 : compact ? 142 : 190, alignItems: 'center', justifyContent: 'flex-end' }}>
   <View style={{ position: 'absolute', bottom: 4, width: tiny ? 48 : compact ? 80 : 144, height: 18, borderRadius: 80, backgroundColor: t.separator }} />
   <Animated.Image source={host.image(`${actor}-${wardrobe.equipped.clothing === 'garden-thread' ? 'garden' : 'character'}.png`)} resizeMode="contain" style={{ width: '100%', height: '100%', transform: [{ rotate: movement.interpolate({ inputRange: [0, 1], outputRange: ['0deg', reduced ? '0deg' : angle] }) }, { translateY: movement.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : action === 'greeting' ? -10 : -2] }) }] }} />
   {belonging && belonging.id !== 'travel-light' && <View accessibilityLabel={`Belonging: ${belonging.name}`} style={{ position: 'absolute', right: 0, bottom: 18, backgroundColor: belonging.color, borderRadius: 14, padding: tiny ? 3 : compact ? 6 : 12, borderWidth: 2, borderColor: t.surface }}><host.Icon name={belonging.icon} size={tiny ? 16 : compact ? 24 : 42} color="#4d473d" /></View>}
  </Pressable>
  {!compact && <><Copy style={{ fontSize: 14 }}>{playing ? rewardById(action)?.name : 'Tap your explorer to preview the action'}</Copy><Small>{belonging?.id === 'travel-light' ? 'Traveling light' : belonging?.name}</Small></>}
 </View>;
}
