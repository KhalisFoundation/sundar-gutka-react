/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.



import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Copy, Heading, Small, useUI } from './components';
import { ExplorerPreview } from './ExplorerPreview';
import { eligible, freshWardrobe, readRewardStory, rewards, unlockAndEquip, wardrobeOf } from './wardrobe';
import { initialProgress } from './rewards';
import { s } from './styles';
import { bold } from './theme';
const tabs = [{ slot: 'clothing', label: 'Clothing' }, { slot: 'belonging', label: 'Belongings' }, { slot: 'action', label: 'Actions' }];
const stories = {
  music: { title: 'Music and companionship', text: 'Bhai Mardana traveled with Guru Nanak and played the rabab alongside his singing. Music and companionship are part of this shared history.', question: 'Who helps you listen and learn?', source: 'Story reference: Darbar, Guru Nanak’s Message of Peace through Music.' },
  seva: { title: 'A small act of seva', text: 'Seva means selfless service. Helping prepare or serve food and caring for shared spaces are ways people can help their community.', question: 'What is one helpful thing you could do today?', source: 'Story reference: Sikh Coalition, Beliefs.' }
};
export function RewardsScreen({ progress, setProgress, onEarn }) {
  const { t, host } = useUI();
  const [slot, setSlot] = useState('clothing');
  const [selected, setSelected] = useState(null);
  const [story, setStory] = useState(null);
  const [demo, setDemo] = useState(null),[message, setMessage] = useState('');
  const active = demo ?? progress,wardrobe = wardrobeOf(active),item = rewards.find((r) => r.id === selected);
  const preview = item ? { ...wardrobe, equipped: { ...wardrobe.equipped, [item.slot]: item.id } } : wardrobe;
  function update(transform) {if (demo)
    setDemo((current) => current ? transform(current) : current);else

    setProgress(transform);}
  function chooseTab(next) {setSlot(next);setSelected(null);setMessage('');}
  function equip(item) {update((p) => unlockAndEquip(p, item.id));setSelected(null);setMessage(`${item.name} equipped${demo ? ' in the demo' : ''}.`);}
  function ruleLabel(item) {const rule = item.unlock;if (wardrobe.owned.includes(item.id))
    return wardrobe.equipped[item.slot] === item.id ? 'Equipped' : 'Owned';if (rule.kind === 'coins')
    return `${rule.cost} coins`;if (rule.kind === 'pauris')
    return eligible(active, item) ? 'Ready to unlock' : 'Complete 1 pauri';if (rule.kind === 'story')
    return eligible(active, item) ? 'Ready to unlock' : 'Read a short story';return 'Free';}
  return <View style={{ padding: 20, gap: 16 }}>
  <View style={s.rowBody}><View style={s.grow}><Heading>Make it yours</Heading><Small>Choose what your explorer wears, carries, and does.</Small></View></View>
  {demo && <View style={{ padding: 12, borderRadius: 12, backgroundColor: t.action, gap: 4 }}><Copy style={{ fontFamily: bold }}>Demo wardrobe · {active.coins} coins</Copy><Small>Your saved coins and rewards are unchanged.</Small><Button secondary onPress={() => {setDemo(null);setSelected(null);setMessage('');}}>Return to my rewards</Button></View>}
  <View style={{ backgroundColor: t.subtle, borderRadius: 20, padding: 12, gap: 8 }}>
   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ flex: 1 }}><ExplorerPreview wardrobe={wardrobe} /></View><View style={{ width: 114, gap: 8 }}>{tabs.map((tab) => <View key={tab.slot} style={{ backgroundColor: t.surface, borderRadius: 10, padding: 8 }}><Small>{tab.label}</Small><Copy style={{ fontSize: 13, lineHeight: 18, fontFamily: bold }}>{rewards.find((r) => r.id === wardrobe.equipped[tab.slot])?.name}</Copy></View>)}</View></View>

  </View>
  {message !== '' && <View accessibilityLiveRegion="polite" style={{ padding: 12, borderRadius: 10, backgroundColor: t.success }}><Copy style={{ color: t.successText }}>{message}</Copy></View>}
  <View style={{ flexDirection: 'row', borderRadius: 12, padding: 4, backgroundColor: t.subtle }}>{tabs.map((tab) => <Pressable key={tab.slot} accessibilityRole="tab" accessibilityState={{ selected: slot === tab.slot }} onPress={() => chooseTab(tab.slot)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: slot === tab.slot ? t.primary : 'transparent' }}><Copy style={{ fontSize: 15, fontFamily: bold, color: slot === tab.slot ? '#fff' : t.text }}>{tab.label}</Copy></Pressable>)}</View>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{rewards.filter((r) => r.slot === slot).map((r) => <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`${r.name}. ${ruleLabel(r)}. Preview`} accessibilityState={{ selected: selected === r.id }} onPress={() => {setSelected(r.id);setMessage('');}} style={{ width: '48%', padding: 12, borderRadius: 14, borderWidth: 2, borderColor: selected === r.id ? t.primary : t.separator, gap: 7 }}><View style={{ height: 70, backgroundColor: r.color, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}><host.Icon name={r.icon} color="#4d473d" size={40} /></View><Copy style={{ fontFamily: bold, lineHeight: 21 }}>{r.name}</Copy><Small>{ruleLabel(r)}</Small></Pressable>)}</View>
  <host.Sheet open={!!item && !story} onOpenChange={(open) => {if (!open)
      setSelected(null);}} title="Preview reward">{item && <View style={{ padding: 16, gap: 8, borderRadius: 14, backgroundColor: t.surface }}><ExplorerPreview wardrobe={preview} /><Small>Preview only. Your equipped items stay unchanged until you confirm.</Small><Heading>{item.name}</Heading><Copy>{item.description}</Copy>
   {wardrobe.equipped[item.slot] === item.id ? <Small>Already equipped</Small> : wardrobe.owned.includes(item.id) ? <Button onPress={() => equip(item)}>Equip {item.name}</Button> : eligible(active, item) ? <><Small>{item.unlock.kind === 'coins' ? `${active.coins} coins available · ${active.coins - item.unlock.cost} after unlocking` : 'This reward is ready. No coins needed.'}</Small><Button onPress={() => equip(item)}>{item.unlock.kind === 'coins' ? `Unlock & equip · ${item.unlock.cost} coins` : 'Unlock & equip for free'}</Button></> : item.unlock.kind === 'story' ? <Button onPress={() => {if (item.unlock.kind === 'story')
          setStory(item.unlock.story);}}>Read story to unlock</Button> : <><Small>{item.unlock.kind === 'coins' ? `Earn ${item.unlock.cost - active.coins} more Nanak coins.` : 'Complete a pauri challenge to unlock this reward.'}</Small><Button secondary onPress={onEarn}>Return to the journey</Button></>}
   <Button secondary onPress={() => setSelected(null)}>Cancel preview</Button>
  </View>}</host.Sheet>
  <Small>New stars earn coins. Stories and milestones unlock special items for free. Both characters share your collection.</Small>
  {!demo && <Button secondary onPress={() => {setDemo({ ...initialProgress, coins: 60, best: { 1: 2 }, wardrobe: freshWardrobe() });setSelected(null);setMessage('');}}>Try rewards with 60 demo coins</Button>}
  <host.Sheet open={story !== null} onOpenChange={(open) => {if (!open)
      setStory(null);}} title={story ? stories[story].title : 'A story for your journey'}>
   {story && <View style={{ padding: 20, gap: 18, backgroundColor: t.surface }}><host.Icon name={story === 'music' ? 'rabab' : 'basket'} color={t.text} size={64} /><Heading>{stories[story].title}</Heading><Copy>{stories[story].text}</Copy><View style={{ backgroundColor: t.subtle, padding: 14, borderRadius: 12 }}><Copy>{stories[story].question}</Copy></View><Small>No answer is recorded. Take a moment to think.</Small><Button onPress={() => {const id = story;update((p) => readRewardStory(p, id));setStory(null);setMessage('Story completed. Your reward is ready to unlock.');}}>Finish story</Button><Button secondary onPress={() => setStory(null)}>Back to rewards</Button><Small>{stories[story].source}</Small><Small>Prototype story and artwork for Khalis review.</Small></View>}
  </host.Sheet>
 </View>;
}
