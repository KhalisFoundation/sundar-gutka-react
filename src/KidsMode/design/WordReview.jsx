/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Copy, Heading, Small, Stars, useUI } from './components';
import { s } from './styles';
import { bold, line as lineFor } from './theme';
import { lineScore } from './content';
import { starsForScore } from './rewards';
import { practicePrompt, sampleWordReview } from './wordFeedback';


export function WordReview({ pauri, score, textSize, onPractice, measured }) {
  const { t, host } = useUI();
  const { Sheet, audio, clip } = host;
  // Real scores when the recitation was actually heard; fixtures otherwise.
  const review = useMemo(() => measured ?? sampleWordReview(pauri, pauri.lines.map((_, i) => lineScore(score, i, pauri.lines.length))), [measured, pauri, score]);
  const words = review.flatMap((line) => line.tokens.flatMap((token) => token.kind === 'word' ? [token.feedback] : []));
  // The service judges words as like/check/unclear; the on-device scorer gives numbers.
  const judged = words.some((word) => word.state !== undefined);
  const flagged = words.filter((word) => judged ? word.state === 'check' : word.score < 80);
  const practise = words.find((word) => word.practise) ?? null;
  const wordStyle = (word) => judged ?
  word.state === 'check' ? { color: t.retryText, backgroundColor: t.retry, textDecorationLine: 'underline' } :
  word.state === 'unclear' ? { color: t.secondary, opacity: 0.5 } : {} :
  { color: word.score < 80 ? t.retryText : t.successText, backgroundColor: word.score < 80 ? t.retry : t.success, textDecorationLine: word.score < 80 ? 'underline' : 'none' };
  const wordLabel = (word) => judged ?
  `${word.text}, ${word.state === 'check' ? 'check this word' : word.state === 'unclear' ? 'unclear' : 'like the reciter'}. Open practice tip` :
  `${word.text}, example score ${word.score} percent, ${word.score < 80 ? 'practice' : 'clear'}. Open practice tip`;
  const [selected, setSelected] = useState(null);
  const prompt = selected ? practicePrompt(selected) : null;
  const currentLine = selected ? pauri.lines[selected.lineIndex] : null;
  function close() {audio.stop();clip?.stop();setSelected(null);}
  // The reciter's own word, next to the line from the Bhai Jarnail Singh track.
  const clipButton = (word) => clip && word.clip ? <Button secondary onPress={() => {audio.stop();clip.play(word.clip);}}>Hear the reciter say {word.text}</Button> : null;
  return <>
    <Heading>Your words</Heading>
    <Small>{judged ? 'Tap a word to hear it.' : 'Tap a word to hear it.'}</Small>
    {judged ? <View style={[s.wrap, { marginVertical: 4 }]}>
      <Copy style={{ paddingHorizontal: 8 }}>Sounds the same</Copy>
      <Copy style={{ color: t.retryText, backgroundColor: t.retry, paddingHorizontal: 8, textDecorationLine: 'underline' }}>Check</Copy>
      <Copy style={{ color: t.secondary, opacity: 0.5, paddingHorizontal: 8 }}>Unclear</Copy>
    </View> : <View style={[s.wrap, { marginVertical: 4 }]}>
      <Copy style={{ color: t.successText, backgroundColor: t.success, paddingHorizontal: 8 }}>Clear</Copy>
      <Copy style={{ color: t.retryText, backgroundColor: t.retry, paddingHorizontal: 8, textDecorationLine: 'underline' }}>Practice</Copy>
    </View>}
    <Small>{judged ? `${flagged.length} words to check` : `Example feedback · ${flagged.length} words to practice`}</Small>
    {judged && <Small>Listen to the words and compare them.</Small>}
    {practise && <View style={[s.info, { backgroundColor: t.retry, gap: 6 }]}><Small>Say this word</Small><Copy style={{ fontFamily: bold, fontSize: textSize, lineHeight: lineFor(textSize), color: t.retryText }}>{practise.text}</Copy><Small>Line {practise.lineIndex + 1}</Small><Button onPress={() => {audio.stop();setSelected(practise);}}>Say this word</Button>{clipButton(practise)}</View>}
    {flagged.length > 0 && !practise && <Button secondary onPress={() => setSelected(flagged[0])}>Words to practise</Button>}
    <View style={{ gap: 22, marginVertical: 12 }}>{review.map((line, lineIndex) => <View key={lineIndex} style={{ gap: 7 }}>
      <View style={s.rowBody}><View style={s.grow}><Small>Line {lineIndex + 1}</Small></View>{judged && <Stars count={line.stars ?? starsForScore(line.score)} />}<Small>{line.score}%</Small></View>
      <Text style={[s.text, { fontSize: textSize, lineHeight: lineFor(textSize), color: t.text }]}>{line.tokens.map((token, index) => token.kind === 'separator' ? <Text key={index}>{token.text}</Text> : <Text key={index} accessible accessibilityRole="button" accessibilityLabel={wordLabel(token.feedback)} onPress={() => {audio.stop();setSelected(token.feedback);}} style={wordStyle(token.feedback)}>{token.text}</Text>)}</Text>
    </View>)}</View>
    <Sheet open={selected !== null} onOpenChange={(open) => {if (!open) close();}} title="Practice coach">
      {selected && prompt && currentLine && <View style={{ padding: 20, gap: 14, backgroundColor: t.surface }}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 36, lineHeight: lineFor(36) }}>{selected.text}</Copy><Small>Line {selected.lineIndex + 1} · Word {selected.wordIndex + 1}</Small></View>{judged ? <View style={{ padding: 12, borderRadius: 10, backgroundColor: selected.state === 'check' ? t.retry : t.subtle }}><Copy style={{ fontFamily: bold, color: selected.state === 'check' ? t.retryText : t.text }}>{selected.state === 'check' ? 'Check' : selected.state === 'unclear' ? 'Unclear' : 'Sounds the same'}</Copy></View> : <View style={{ padding: 12, borderRadius: 10, backgroundColor: selected.score < 80 ? t.retry : t.success }}><Copy style={{ fontFamily: bold, fontSize: 26, lineHeight: lineFor(26), color: selected.score < 80 ? t.retryText : t.successText }}>{selected.score}%</Copy><Small>Practice score</Small></View>}</View>
        {judged && (selected.reasons?.length ?? 0) > 0 && <View style={{ gap: 4 }}>{selected.reasons?.map((reason) => <Small key={reason}>{reason}</Small>)}</View>}
        <Heading>{judged ? selected.state === 'check' ? 'Have a listen' : 'Nicely said' : prompt.title}</Heading>
        <Copy>{prompt.tip}</Copy>
        <View style={{ gap: 8 }}>{prompt.steps.map((step, i) => <Copy key={step}>{i + 1}. {step}</Copy>)}</View>
        {clipButton(selected)}
        {clip && clip.error.length > 0 && selected.clip && <Copy style={{ color: t.retryText }}>{clip.error}</Copy>}
        <Button onPress={() => audio.playing ? audio.stop() : audio.listen(currentLine.start, currentLine.end, 0.8)}>{audio.playing ? 'Stop' : 'Hear it again'}</Button>
        <Small>{host.reciterName ?? 'Bhai Jarnail Singh'} · Slower playback</Small>
        <Button secondary onPress={() => {const line = selected.lineIndex;close();onPractice(line);}}>Say this line</Button>
        {flagged.length > 1 && <Button secondary onPress={() => {audio.stop();const index = flagged.findIndex((word) => word.id === selected.id);setSelected(flagged[(index + 1) % flagged.length]);}}>Next word</Button>}
        {audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}
        <Button secondary onPress={close}>Back</Button>
        <Small>{judged ? 'Listen to the words and compare them.' : measured ? 'Each word shows how its line went.' : 'These are practice ideas, not a check of your voice.'}</Small>
      </View>}
    </Sheet>
  </>;
}
