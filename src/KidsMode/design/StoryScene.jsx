/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { storyForPauri, storyStopForLine } from './story';
import { font } from './theme';
import { useUI } from './components';


export function StoryScene({ line, host, pauri = 1, overview = false, onSelect }) {
  const { t } = useUI();
  const [width, setWidth] = useState(353);
  const imageWidth = width * 4;
  const imageHeight = imageWidth / 3;
  const [reduced, setReduced] = useState(false);
  useEffect(() => {let active = true;AccessibilityInfo.isReduceMotionEnabled().then((value) => {if (active) setReduced(value);});const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);return () => {active = false;subscription.remove();};}, []);
  const story = storyForPauri(pauri);
  const stop = story ? storyStopForLine(story, line) : undefined;
  const pan = useRef(new Animated.Value(stop?.x ?? 0)).current;
  useEffect(() => {if (!stop) return;const move = Animated.timing(pan, { toValue: stop.x, duration: reduced ? 0 : 450, useNativeDriver: false });move.start();return () => move.stop();}, [pan, stop, reduced]);
  if (!story || !stop) return null;
  return <View style={{ gap: 8 }}>
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ ...(overview ? { aspectRatio: 3 } : { height: 180 }), overflow: 'hidden', borderRadius: 12, backgroundColor: '#f3f1e8' }}>
      <Animated.Image source={host.image(story.image)} resizeMode={overview ? "contain" : "cover"} accessibilityLabel={overview ? `The whole connected Pauri ${pauri} memory walk` : `${stop.place}. ${stop.cue}`} style={overview ? { width: '100%', height: '100%' } : { position: 'absolute', width: imageWidth, height: imageHeight, top: 90 - imageHeight * 0.6, left: pan.interpolate({ inputRange: [0, 1], outputRange: [0, width - imageWidth] }) }} />
    </View>
    {onSelect && <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-between' }}>{story.stops.map((s, i) => {const active = line >= s.start && line <= s.end;return <Pressable accessibilityRole="button" accessibilityLabel={`Story stop ${i + 1}: ${s.place}, lines ${s.start + 1} to ${s.end + 1}`} accessibilityState={{ selected: active }} key={s.place} onPress={() => onSelect?.(s.start)} style={{ flex: 1, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.primary : t.subtle }}><Text style={{ fontFamily: font, color: active ? '#fff' : t.text }}>{i + 1}</Text></Pressable>;})}</View>}
  </View>;
}
