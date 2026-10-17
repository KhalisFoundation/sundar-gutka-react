/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
import { RewardsScreen } from './RewardsScreen';
import { ExplorerPreview } from './ExplorerPreview';
import { wardrobeOf } from './wardrobe';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Pressable, Switch, Text, View } from 'react-native';
import { Avatar, Button, Copy, Heading, Row, Section, Small, Stars, UIProvider } from './components';
import { s } from './styles';
import { coinAward, completePauri, starsForScore } from './rewards';
import { bold, dark, legacyFont, light, line as lineFor } from './theme';
import { characters, regions } from './content';
import catalog from './bani-catalog.json';
import { freshExperience } from './experience';
import { storyForPauri, storyStopForLine } from './story';
import { StoryScene } from './StoryScene';
import { WordReview } from './WordReview';


export default function KidsApp({ pauris, host }) {
  const [saved] = useState(() => host.storage.load());
  const [attempts, setAttempts] = useState(saved.attempts);
  const [recall, setRecall] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [illustrations, setIllustrations] = useState(saved.illustrations);
  const [showOverview, setShowOverview] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [reviewControls, setReviewControls] = useState(false);
  const [autoScore, setAutoScore] = useState(true);
  const [screen, setScreen] = useState(host.initialScreen ?? 'home');
  const [settingsReturn, setSettingsReturn] = useState('home');
  const [kids, setKids] = useState(saved.kids);
  const [night, setNight] = useState(saved.night);
  const [meaning, setMeaning] = useState(saved.meaning);
  const [textSize, setTextSize] = useState(saved.textSize);
  const [character, setCharacter] = useState(saved.character);
  const [started, setStarted] = useState(saved.started);
  const [progress, setProgress] = useState(saved.progress);
  const [region, setRegion] = useState(saved.region);
  const [selected, setSelected] = useState(saved.selected);
  const [line, setLine] = useState(0);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(84);
  // Set only when the challenge was actually recorded and scored on device.
  const [measured, setMeasured] = useState(null);
  const [checking, setChecking] = useState(false);
  // Persistent, unlike `notice`: an unclear recording must be retried, not missed.
  const [retry, setRetry] = useState('');
  const [award, setAward] = useState(0);
  const [notice, setNotice] = useState('');
  const t = night ? dark : light;
  const { Scroll, Icon, audio, recitation } = host;
  const remote = recitation?.provider === "service";
  const pauri = pauris[selected - 1];
  const current = pauri.lines[line] ?? pauri.lines[0];
  const stars = starsForScore(score);
  const best = progress.best[String(selected)] ?? 0;
  const totalStars = Object.values(progress.best).reduce((sum, n) => sum + n, 0);
  const completed = Object.values(progress.best).filter((n) => n > 0).length;
  const story = storyForPauri(selected);
  const storyStop = story ? storyStopForLine(story, line) : undefined;
  useEffect(() => {setRevealed(false);setShowCue(false);}, [line, screen]);
  useEffect(() => {setSaveFailed(!host.storage.save({ version: 1, kids, night, meaning, illustrations, textSize, character, started, progress, selected, region, attempts }));}, [host.storage, kids, night, meaning, illustrations, textSize, character, started, progress, selected, region, attempts]);

  const main = ['world', 'map', 'rewards', 'journal'].includes(screen);
  const reading = screen === 'reader' || screen === 'practice' || screen === 'challenge';
  // Inside a host app, leaving the journey returns to the host's home, not the design's copy of it.
  function leave() { if (host.exit) host.exit(); else go('home'); }
  function go(next) {
    if (checking) return;
    audio.stop();
    // Abandoning a challenge mid-recording would otherwise leave iOS in
    // play-and-record, which silently routes later playback to the earpiece.
    if (recitation?.isRecording) void (recitation.cancel ? recitation.cancel() : recitation.stop());
    setRunning(false);setNotice('');setScreen(next);
  }
  function openPauri(n) {setRegion(Math.max(0, regions.findIndex((r) => n >= r.start && n <= r.end)));setSelected(n);setLine(0);go('pauri');}
  function settings() {setSettingsReturn(screen);go('settings');}
  async function finishRecitation() {
    if (!recitation || checking) return;
    setChecking(true);
    const result = await recitation.stop().finally(() => setChecking(false));
    if (result && 'retry' in result) {
      // Only this line failed. Stay on it rather than losing the whole pauri.
      setNotice(result.retry);
      if (!(await (recitation.retry ? recitation.retry() : recitation.start(selected, pauri.lines.length)))) {setRetry(result.retry);setRunning(false);setScreen('ready');}
      return;
    }
    if (result && 'nextLine' in result) {
      // That line is scored and the microphone has already moved on.
      setLine(result.nextLine);
      return;
    }
    if (!result) {setNotice(recitation.error ?? 'We could not check that. Try again.');setRunning(false);setScreen('ready');return;}
    setMeasured(result.review);setScore(result.score);
    setAttempts((a) => [{ pauri: selected, score: result.score, at: Date.now() }, ...a].slice(0, 50));
    setAward(coinAward(best, starsForScore(result.score)));
    setProgress((p) => completePauri(p, selected, result.score));
    setRunning(false);setScreen('results');
  }

  function back() {
    if (screen === 'settings') {go(!kids && settingsReturn !== 'reader' ? 'home' : settingsReturn);return;}
    if (['practice', 'ready', 'results'].includes(screen)) {go('pauri');return;}
    if (screen === 'story') {go('pauri');return;}
    if (screen === 'pauri') {go('map');return;}
    if (screen === 'reader' || screen === 'world') {leave();return;}
    if (screen === 'character') {started ? go('journal') : leave();return;}
    go('world');
  }
  // Host edit: Android hardware back steps through the journey like the header chevron; the ref keeps one listener on the latest back().
  const backRef = useRef(back);backRef.current = back;
  useEffect(() => {const sub = BackHandler.addEventListener('hardwareBackPress', () => {backRef.current();return true;});return () => sub.remove();}, []);
  useEffect(() => {if (!notice) return;const timer = setTimeout(() => setNotice(''), 3500);return () => clearTimeout(timer);}, [notice]);
  useEffect(() => {
    // Simulation only. When recording, the child's voice sets the pace.
    if (screen !== 'challenge' || !running || recitation) return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);return () => clearInterval(timer);
  }, [screen, running, recitation]);
  useEffect(() => {
    if (screen !== 'challenge' || !running || recitation) return;
    setLine(Math.min(Math.floor(tick / 4), pauri.lines.length - 1));
    if (tick >= pauri.lines.length * 4) {
      setAttempts((a) => [{ pauri: selected, score, at: Date.now() }, ...a].slice(0, 50));setAward(coinAward(best, stars));setProgress((p) => completePauri(p, selected, score));setRunning(false);setScreen('results');
    }
  }, [tick, screen, running, recitation, pauri, best, stars, selected, score]);
  // Follow the child: each detected pause moves to the next line.
  useEffect(() => {
    if (screen !== 'challenge' || !recitation) return;
    setLine(Math.min(recitation.currentLine, pauri.lines.length - 1));
  }, [screen, recitation, pauri.lines.length]);
  // A recorded challenge ends when the last line has been scored.
  useEffect(() => {
    if (screen !== 'challenge' || !recitation || !running) return;
    if (recitation.currentLine >= pauri.lines.length) void finishRecitation();
  }, [screen, recitation, running, pauri.lines.length]);

  const title = screen === 'home' ? 'ਸੁੰਦਰ ਗੁਟਕਾ' : screen === 'settings' ? 'Settings' : screen === 'world' ? 'Bani worlds' : screen === 'map' ? 'Japji Sahib' : screen === 'character' ? 'Choose your explorer' : screen === 'rewards' ? 'Nanak rewards' : screen === 'journal' ? 'My explorer' : screen === 'reader' ? 'ਜਪੁਜੀ ਸਾਹਿਬ' : screen === 'story' ? `Pauri ${selected} · memory walk` : `Pauri ${selected}`;

  return <UIProvider value={{ t, host, character, wardrobe: wardrobeOf(progress) }}><View style={[s.app, { backgroundColor: host.statusBarBackground ?? t.surface, paddingTop: host.safeArea.top }]}>
    {screen === 'home' ? <View style={[s.homeHeader, { backgroundColor: t.primary }]}>
      <Text style={s.fateh}><Text style={{ fontFamily: legacyFont, fontSize: 20 }}>{'<> '}</Text>ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ</Text>
      <View style={s.homeTitleRow}><Text style={s.homeTitle}><Text style={s.ornament}>Œ</Text> ਸੁੰਦਰ ਗੁਟਕਾ <Text style={s.ornament}>‰</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={settings} style={s.settingsButton}><Icon name="settings" color="#faf9f6" size={28} /></Pressable></View>
    </View> : <View style={[s.header, { borderColor: t.separator, backgroundColor: t.surface }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={screen === 'challenge' ? 'Leave challenge' : 'Back'} onPress={back} style={s.iconButton}><Icon name="chevron-left" color={t.text} /></Pressable>
      <View style={s.grow}><Copy style={s.headerTitle}>{title}</Copy>{reading && <Small>{screen === 'challenge' ? 'Challenge · line-by-line recitation' : screen === 'practice' ? 'Practice · Japji Sahib' : 'Sundar Gutka'}</Small>}</View>
      {main ? <Pressable accessibilityRole="button" accessibilityLabel={`${progress.coins} Nanak coins. Open rewards`} onPress={() => go('rewards')} style={[s.wallet, { backgroundColor: t.action }]}><Icon name="coins" color={t.text} size={19} /><Copy style={{ fontFamily: bold }}>{progress.coins}</Copy></Pressable> : screen !== 'settings' && <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={settings} style={s.iconButton}><Icon name="settings" color={t.text} /></Pressable>}
    </View>}
    <View style={[s.content, { backgroundColor: t.surface }]}><Scroll key={screen === 'practice' ? `${screen}-${line}` : screen}><View style={{ paddingBottom: 24 }}>
      {screen === 'home' && <>
        {kids && <Row title="Kids Mode" subtitle={started ? `${characters.find((c) => c.id === character)?.name} · ${totalStars} stars` : 'Choose an explorer and begin'} icon="map" onPress={() => go(started ? 'world' : 'character')} />}
        {catalog.map(({ name, token }) => <Pressable accessibilityRole="button" key={name} onPress={() => {if (token === 'japji') {setSelected(1);setLine(0);go('reader');} else setNotice('This prototype includes Japji Sahib. More banis will be available in the app.');}} style={({ pressed }) => [s.baniRow, { borderColor: t.separator, backgroundColor: pressed ? t.action : t.surface }]}><Copy style={{ fontSize: 23, lineHeight: lineFor(23) }}>{name}</Copy></Pressable>)}
        <View style={[s.pad, s.center]}><Image source={host.image('khalislogo150.png')} style={{ width: 68, height: 68 }} resizeMode="contain" /><Small>With love, Khalis Foundation</Small></View>
      </>}
      {screen === 'settings' && <>
        <Section>Learning</Section><Row title="Kids Mode" subtitle="Explore bani through practice and play" icon="map" trailing={<Switch accessibilityLabel="Kids Mode" value={kids} onValueChange={setKids} trackColor={{ false: '#c8c8cc', true: t.primary }} />} />
        {kids && <View style={s.pad}><Button onPress={() => go(started ? 'world' : 'character')}>{started ? 'Open my journey' : 'Choose an explorer'}</Button></View>}
        <Section>Display</Section><Row title="Illustrations" subtitle="Show visual cues while reading" trailing={<Switch accessibilityLabel="Illustrations" value={illustrations} onValueChange={setIllustrations} trackColor={{ false: '#c8c8cc', true: t.primary }} />} /><Row title="Night mode" icon="book-open" trailing={<Switch accessibilityLabel="Night mode" value={night} onValueChange={setNight} trackColor={{ false: '#c8c8cc', true: t.primary }} />} />
        <Row title="English meanings" subtitle="Show translations while reading" trailing={<Switch accessibilityLabel="English meanings" value={meaning} onValueChange={setMeaning} trackColor={{ false: '#c8c8cc', true: t.primary }} />} />
        <Row title="Font size" subtitle={`${textSize} pt`} trailing={<View style={s.inline}><Button secondary label="Decrease font size" disabled={textSize <= 21} onPress={() => setTextSize((n) => n - 2)}>A−</Button><Button secondary label="Increase font size" disabled={textSize >= 35} onPress={() => setTextSize((n) => n + 2)}>A+</Button></View>} />
        <Row title="Font face" subtitle="Baloo Paaji 2" />
        {__DEV__ && <><Section>Preview controls</Section><Row title="Show test controls" subtitle="Choose a sample result for team review" trailing={<Switch accessibilityLabel="Show test controls" value={reviewControls} onValueChange={setReviewControls} trackColor={{ false: '#c8c8cc', true: t.primary }} />} />{reviewControls && <View style={s.pad}><Row title="Automatic sample progression" trailing={<Switch accessibilityLabel="Automatic sample progression" value={autoScore} onValueChange={setAutoScore} />} />{!autoScore && <View style={s.inline}>{[72, 84, 96].map((n) => <Button key={n} secondary onPress={() => setScore(n)}>{n}%{score === n ? ' ✓' : ''}</Button>)}</View>}<Button secondary onPress={() => {const v = freshExperience();setProgress(v.progress);setAttempts([]);setSelected(1);setRegion(0);setNotice('Practice progress reset. Your explorer and display settings are kept.');}}>Reset practice progress</Button></View>}<Section>About</Section><View style={s.pad}><Small>Try Japji Sahib, Kids Mode, and the display controls above. Other Sundar Gutka settings and banis are outside this preview. Progress and settings are saved on this browser. No account is created. Challenge recordings are sent to the scoring service only when you finish a line.</Small></View></>}
      </>}
      {screen === 'reader' && <><View style={s.pad}><Small>Japji Sahib · Pauri {selected}</Small></View>{pauri.lines.map((l, i) => <Pressable accessibilityRole="button" accessibilityLabel={`Listen to line ${i + 1}`} key={i} onPress={() => {setLine(i);audio.listen(l.start, l.end);}} style={[s.readerLine, { backgroundColor: audio.playing && line === i ? t.action : t.surface }]}><Copy style={[s.verse, { fontSize: textSize, lineHeight: lineFor(textSize) }]}>{l.text}</Copy>{meaning && <Copy style={s.translation}>{l.translation}</Copy>}</Pressable>)}<View style={s.pad}><Small>This reading preview contains the 38 pauris. The opening Mool Mantar and closing Salok remain in the full app.</Small><View style={s.inline}><Button secondary disabled={selected === 1} onPress={() => {audio.stop();setSelected((n) => n - 1);}}>Previous pauri</Button><Button secondary disabled={selected === 38} onPress={() => {audio.stop();setSelected((n) => n + 1);}}>Next pauri</Button></View>{audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}</View></>}
      {screen === 'character' && <View style={s.pad}><Heading>A friend for your journey</Heading><Small>Choose Prem Singh or Sehaj Kaur from the Khalis books. Both explore the same world.</Small><View style={[s.inline, { marginVertical: 22 }]}>{characters.map((c) => <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: character === c.id }} onPress={() => setCharacter(c.id)} style={[s.characterChoice, { backgroundColor: t.subtle, borderColor: character === c.id ? t.primary : t.separator }]}><Avatar who={c.id} /><Copy style={{ fontFamily: bold }}>{c.name}</Copy><Small>{character === c.id ? 'Selected' : 'Choose'}</Small></Pressable>)}</View><Button onPress={() => {setStarted(true);go('world');}}>{started ? 'Save my explorer' : 'Begin my journey'}</Button><Small>Both characters are free. You can change your explorer at any time.</Small></View>}
      {screen === 'world' && <><View style={[s.pad, s.rowBody]}><View style={s.grow}><Heading>Your bani journey</Heading><Small>Choose where to practice.</Small></View><Pressable accessibilityRole="button" accessibilityLabel="Customize my explorer" onPress={() => go('character')}><Avatar small /></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="Explore Japji Sahib" onPress={() => go('map')} style={[s.worldCard, { backgroundColor: t.action }]}><Image source={host.image('journey-calm.jpg')} style={s.fill} resizeMode="cover" /><View style={s.worldCaption}><Text style={[s.text, { color: light.primary, fontSize: 28, fontFamily: bold, lineHeight: lineFor(28) }]}>Japji Sahib</Text><Text style={[s.text, { color: light.primary, fontSize: 14, lineHeight: lineFor(14) }]}>38 pauris · 6 regions</Text></View><View style={s.worldCta}><Text style={[s.text, { color: '#fff', fontFamily: bold }]}>{completed ? 'Continue exploring' : 'Begin your journey'}  →</Text></View></Pressable><View style={s.pad}><Button onPress={() => openPauri(selected)}>Continue Pauri {selected}</Button><Small>{attempts.length ? `${attempts.length} challenges completed · Your journey is saved here.` : "Your progress saves on this device."}</Small></View><Section>More banis</Section>{['Jaap Sahib', 'Anand Sahib', 'Chaupai Sahib', 'Rehras Sahib', 'Tav Prasad Savaiye', 'Kirtan Sohila'].map((name) => <Row key={name} title={name} subtitle="Coming later" icon="book-open" onPress={() => setNotice(`${name} is a preview. Japji Sahib is ready to explore.`)} />)}</>}
      {screen === 'map' && <>
        <View style={s.pad}>
          <View style={s.rowBody}><View style={s.grow}><Heading>One path through Japji Sahib</Heading><Small>Scroll through all six regions.</Small></View><Icon name="star" color="#cba51e" /><Copy>{totalStars}/114</Copy></View>
          <Button onPress={() => openPauri(selected)}>Continue with Pauri {selected}  →</Button>
        </View>
        {regions.map((chapter, index) => <View key={chapter.name}>
          <View style={[s.pad, { backgroundColor: t.subtle }]}>
            <Small>Region {index + 1} · Pauris {chapter.start}–{chapter.end}</Small>
            <Heading>{chapter.name}</Heading>
            <Small>{chapter.place}</Small>
          </View>
          <View style={[s.map, { aspectRatio: chapter.aspectRatio }]}>
            <Image source={host.image(chapter.image)} accessibilityLabel={chapter.description} style={s.fill} resizeMode="cover" />
            {Array.from({ length: chapter.end - chapter.start + 1 }, (_, i) => {
                    const n = chapter.start + i;
                    const count = progress.best[String(n)] ?? 0;
                    // Follow the painted clearings from top to bottom as the child scrolls.
                    const position = chapter.nodes[chapter.nodes.length - 1 - i];
                    return <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Pauri ${n}, ${count} of 3 stars`} onPress={() => openPauri(n)} style={[s.mapNode, { left: `${position[0]}%`, top: `${position[1]}%`, marginLeft: -30, marginTop: -24 }]}>
                <View style={[s.nodeDisc, { backgroundColor: n === selected ? t.primary : count ? '#426a46' : '#fff', borderColor: '#fff' }]}><Text style={[s.text, { fontFamily: bold, fontSize: 23, lineHeight: lineFor(23), color: count || n === selected ? '#fff' : light.primary }]}>{n}</Text></View>
                <View style={s.nodeStars}><Stars count={count} /></View>
              </Pressable>;
                  })}
          </View>
        </View>)}
        <View style={s.pad}><Heading>A journey to keep returning to</Heading><Small>Revisit any pauri to practice and grow your mastery.</Small></View>
      </>}
      {screen === 'pauri' && <><View style={[s.pad, s.center, { backgroundColor: t.subtle }]}><Small>Japji Sahib</Small><Heading>Pauri {selected}</Heading><Stars count={best} large /><Small>{pauri.lines.length} lines · Your best: {best}/3 stars</Small></View>{story && <View style={{ padding: 16, gap: 10 }}>
        <Copy style={{ fontFamily: bold, fontSize: 18, lineHeight: lineFor(18) }}>{story.title}</Copy>
        <StoryScene pauri={selected} line={0} host={host} overview />
        <Small>The whole landscape for this pauri. Follow its landmarks as you practice.</Small>
      </View>}<Row title="Practice" subtitle="Listen and practice one line at a time" icon="headphones" onPress={() => {setLine(0);go('practice');}} /><Row title="Challenge" subtitle="Recite continuously. Review at the end." icon="mic" onPress={() => go('ready')} />{story && <Row title="Walk the story" subtitle={`Explore ${story.stops.length} connected visual cues`} icon="map" onPress={() => {setLine(0);go('story');}} />}<View style={s.pad}><Row title="Recall practice" subtitle="Hide the words until you are ready" trailing={<Switch accessibilityLabel="Recall practice" value={recall} onValueChange={setRecall} />} /></View><View style={s.pad}><Heading>Stars and coins</Heading><Copy>Every new star earns 10 Nanak coins.</Copy><Small>1 star: 60–79% · 2 stars: 80–94% · 3 stars: 95–100%. These thresholds are proposed for V1.</Small><Small>Replays keep your best result. Improve your stars to earn the difference.</Small></View></>}
      {screen === 'story' && <View style={s.pad}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 18, lineHeight: lineFor(18) }}>{storyStop?.place}</Copy></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View>
        {illustrations && <StoryScene pauri={selected} line={line} host={host} overview={showOverview} onSelect={(n) => {audio.stop();setLine(n);}} />}
        <Copy style={[s.verse, { fontSize: textSize, lineHeight: lineFor(textSize) }]}>{current.text}</Copy><Copy style={{ fontSize: 19, lineHeight: 29, marginBottom: 12, color: t.text }}>{current.transliteration}</Copy>
        {meaning && <Copy style={s.translation}>{current.translation}</Copy>}
        <Row expanded={showCue} title="About this picture" onPress={() => setShowCue((v) => !v)} trailing={<Copy>{showCue ? '−' : '+'}</Copy>} />
        {showCue && <Small>{storyStop?.reflection}</Small>}
        {illustrations && <Button secondary onPress={() => setShowOverview((v) => !v)}>{showOverview ? 'Show this place' : 'Show the whole path'}</Button>}
        {audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}
      </View>}
      {screen === 'practice' && <View style={s.pad}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 18, lineHeight: lineFor(18) }}>{recall ? 'Recall practice' : 'Listen and repeat'}</Copy></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View>
        {illustrations && story && <StoryScene pauri={selected} line={line} host={host} />}
        {recall && !revealed ? <><Heading>Can you recall this line?</Heading><Button secondary onPress={() => setRevealed(true)}>Show the words</Button></> : <><Copy style={[s.verse, { fontSize: textSize, lineHeight: lineFor(textSize) }]}>{current.text}</Copy><Copy style={{ fontSize: 19, lineHeight: 29, marginBottom: 12, color: t.text }}>{current.transliteration}</Copy>{meaning && <Copy style={s.translation}>{current.translation}</Copy>}</>}
        <View style={s.rowBody}><View style={s.grow}><Small>Bhai Jarnail Singh</Small></View><Pressable accessibilityRole="button" accessibilityLabel={slow ? 'Playback speed 0.8 times. Switch to normal speed' : 'Playback speed normal. Switch to slower speed'} onPress={() => {audio.stop();setSlow((v) => !v);}} style={[s.speed, { borderColor: t.separator }]}><Copy>{slow ? '0.8×' : '1×'} speed</Copy></Pressable></View>
        <Row expanded={showLines} title="Choose a line" onPress={() => setShowLines((v) => !v)} trailing={<Copy>{showLines ? '−' : '+'}</Copy>} />
        {showLines && pauri.lines.map((l, i) => <Row key={i} title={l.text} onPress={() => {audio.stop();setLine(i);setShowLines(false);}} trailing={<Copy>{i === line ? '✓' : ''}</Copy>} />)}
        {audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}
      </View>}
      {screen === 'ready' && <View style={s.pad}><View style={[s.center, { paddingVertical: 22 }]}><Icon name="mic" color={t.primary} size={44} /></View><Heading>Recite Pauri {selected}</Heading><Copy>Say each line out loud. We will listen.</Copy>{retry.length > 0 && <View accessibilityLiveRegion="polite" style={[s.info, { backgroundColor: t.retry }]}><Copy style={{ color: t.retryText }}>{retry}</Copy></View>}<Button onPress={async () => {
                setMeasured(null);setRetry('');
                if (recitation) {
                  // Release the reference player first. iOS will not hand over the
                  // microphone while the session is still set up for playback, and
                  // refuses with AVAudioSessionErrorCodeInsufficientPriority.
                  audio.stop();
                  if (!recitation.granted && !(await recitation.requestPermission())) {setNotice('We need the microphone to hear you.');return;}
                  if (!(await recitation.start(selected, pauri.lines.length))) {setNotice(recitation.error ?? 'We could not start listening. Try again.');return;}
                  setLine(0);setTick(0);setRunning(true);setScreen('challenge');return;
                }
                if (autoScore) setScore(attempts.some((a) => a.pauri === selected) ? 96 : 84);setLine(0);setTick(0);setRunning(true);setScreen('challenge');
              }}>{retry ? 'Try again' : 'Begin challenge'}</Button><Small>{remote ? 'When you finish each line, your recording is sent to the pronunciation scoring service to compare it with Bhai Jarnail Singh. This only happens while "Check pronunciation online" is on in Settings; the service does not keep audio.' : recitation ? 'Your recording is sent to the pronunciation scoring service only when a parent turns on "Check pronunciation online" in Settings.' : 'Interactive preview: no microphone is used. Alignment and feedback are simulated.'}</Small><Button secondary onPress={() => go('practice')}>Practice first</Button></View>}
      {screen === 'challenge' && <View style={s.pad}><View style={s.rowBody}><View style={s.grow}><Small>{running ? 'Reciting' : 'Paused'}</Small></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View><View style={[s.track, { backgroundColor: t.separator }]}><View style={{ height: 4, width: `${tick / (pauri.lines.length * 4) * 100}%`, backgroundColor: t.primary }} /></View>{illustrations && story && !remote && <StoryScene pauri={selected} line={line} host={host} />}{remote ? <View style={{ paddingVertical: 16, gap: 10 }}>{pauri.lines.map((l, i) => <Copy key={i} style={[s.verse, { fontSize: textSize, lineHeight: lineFor(textSize), textAlign: 'center' }]}>{l.text}</Copy>)}</View> : <View accessibilityLiveRegion="polite" style={{ paddingVertical: 16 }}><Copy style={[s.verse, { fontSize: textSize, lineHeight: lineFor(textSize), textAlign: 'center' }]}>{current.text}</Copy><Copy style={{ color: t.secondary, fontSize: 19, lineHeight: lineFor(19), textAlign: 'center', marginTop: 22 }}>{pauri.lines[line + 1]?.text ?? 'Final line'}</Copy></View>}{recitation ? <>
        <View style={[s.track, { backgroundColor: t.separator, marginTop: 10 }]}><View style={{ height: 4, width: `${Math.round(recitation.level * 100)}%`, backgroundColor: recitation.isRecording ? t.primary : t.separator }} /></View>
        {<View style={[s.inline, { justifyContent: 'center', paddingVertical: 8 }]}>{pauri.lines.map((_, i) => {const r = recitation.lineScores.find((x) => x.lineIndex === i);return <View key={i} style={[s.chip, { backgroundColor: r ? r.score < 80 ? t.retry : t.success : t.subtle, borderColor: t.separator }]}><Copy style={{ fontSize: 13, lineHeight: lineFor(13), color: r ? r.score < 80 ? t.retryText : t.successText : t.secondary }}>{r ? `${r.score}%` : i + 1}</Copy></View>;})}</View>}
        {checking ? <View accessibilityLiveRegion="polite" style={[s.center, { paddingVertical: 12, gap: 8 }]}><ActivityIndicator color={t.primary} /><Copy style={{ fontFamily: bold }}>Checking line {line + 1}\u2026</Copy><Small>This may take a moment.</Small></View> : <Button onPress={finishRecitation}>{line >= pauri.lines.length - 1 ? 'Finish and see my score' : `Done with line ${line + 1}`}</Button>}
        <Small>{remote ? recitation.isRecording ? `Recording line ${line + 1} of ${pauri.lines.length} \u00b7 checked when you finish the line` : checking ? 'Checking this line' : 'Not recording' : recitation.isRecording ? 'Listening \u00b7 recorded and scored on this device only' : 'Not recording'}</Small>
        {recitation.error ? <Copy style={{ color: t.retryText }}>{recitation.error}</Copy> : null}
      </> : <>
        <Button secondary onPress={() => setRunning((v) => !v)}>{running ? 'Pause challenge' : 'Resume challenge'}</Button><Small>Demo playback · No voice recorded or assessed</Small>
      </>}</View>}
      {screen === 'results' && <View style={s.pad}>
        <Heading>All done!</Heading>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 44, lineHeight: lineFor(44) }}>{score}%</Copy><Small>{measured ? remote ? 'Share of words like the reciter\u2019s' : 'Compared with the ustaad\u2019s recording on this device' : 'Practice score'}</Small></View><Stars count={stars} large /></View>
        <View style={[s.info, { backgroundColor: t.action, marginVertical: 4 }]}><Copy style={{ fontFamily: bold }}>{award ? `+${award} Nanak coins` : 'Best score kept'}</Copy><Small>{award ? '10 coins for each new star' : 'Improve your best star count to earn more coins.'}</Small></View>
        <WordReview pauri={pauri} score={score} measured={measured} textSize={textSize} onPractice={(index) => {setLine(index);setRecall(false);go('practice');}} />
        <Button onPress={() => {if (selected < 38) openPauri(selected + 1);else go('map');}}>{selected < 38 ? 'Continue to the next pauri' : 'Return to the journey'}</Button>
        <Button secondary onPress={() => go('rewards')}>Visit rewards</Button>
        <View style={s.inline}><Button secondary onPress={() => go('ready')}>Try again</Button><Button secondary onPress={() => go('map')}>Back to map</Button></View>
      </View>}
      {screen === 'rewards' && <RewardsScreen progress={progress} setProgress={setProgress} onEarn={() => go('map')} />}
      {screen === 'journal' && <View style={s.pad}><View style={s.center}><ExplorerPreview wardrobe={wardrobeOf(progress)} /><Heading>{characters.find((c) => c.id === character)?.name}’s journey</Heading><Button secondary onPress={() => go('character')}>Customize my explorer</Button></View><View style={[s.info, s.rowBody, { backgroundColor: t.subtle }]}>{[[completed, 'pauris'], [totalStars, 'stars'], [progress.coins, 'coins']].map(([n, label]) => <View key={label} style={[s.grow, s.center]}><Copy style={{ fontSize: 28, fontFamily: bold, lineHeight: lineFor(28) }}>{n}</Copy><Small>{label}</Small></View>)}</View><Heading>Your progress</Heading>{completed ? Object.entries(progress.best).map(([n, count]) => <Row key={n} title={`Pauri ${n}`} trailing={<Stars count={count} />} onPress={() => openPauri(Number(n))} />) : <Button onPress={() => go('map')}>Explore your first pauri</Button>}<Heading>Recent practice</Heading>{attempts.slice(0, 8).map((a, i) => <Row key={`${a.at}-${i}`} title={`Pauri ${a.pauri} · ${a.score}%`} subtitle={`Sample challenge ${attempts.length - i}`} onPress={() => openPauri(a.pauri)} trailing={<Stars count={starsForScore(a.score)} />} />)}<Small>Progress is shared between both characters and saved on this browser.</Small></View>}
    </View></Scroll></View>
    {(screen === 'practice' || screen === 'story') && <View style={[s.readingControls, { backgroundColor: t.surface, borderColor: t.separator, paddingBottom: Math.max(12, host.safeArea.bottom) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous line" accessibilityState={{ disabled: line === 0 }} disabled={line === 0} onPress={() => {audio.stop();setLine((n) => n - 1);}} style={[s.iconButton, { opacity: line === 0 ? 0.35 : 1 }]}><Icon name="chevron-left" color={t.text} /></Pressable>
      <View style={s.grow}><Button onPress={() => audio.playing ? audio.stop() : audio.listen(current.start, current.end, slow ? 0.8 : 1)}>{audio.playing ? 'Pause' : 'Listen'}</Button></View>
      <View style={s.grow}><Button secondary onPress={() => {audio.stop();if (line === pauri.lines.length - 1) {if (screen === 'story') {setLine(0);setRecall(true);go('practice');} else go('ready');} else setLine((n) => n + 1);}}>{line === pauri.lines.length - 1 ? screen === 'story' ? 'Try recall' : 'Challenge' : 'Next line'}</Button></View>
    </View>}
    {(main || screen === 'settings' || screen === 'reader') && <View style={[s.nav, { backgroundColor: t.primary, paddingBottom: Math.max(8, host.safeArea.bottom) }]}>{(main ? [{ target: 'world', label: 'Worlds', icon: 'book-open' }, { target: 'map', label: 'Journey', icon: 'map' }, { target: 'rewards', label: 'Rewards', icon: 'coins' }, { target: 'journal', label: 'Explorer', icon: 'navigation' }] : [{ target: 'home', label: 'Home', icon: 'home' }, ...(screen === 'reader' ? [{ target: 'reader', label: audio.playing ? 'Pause' : 'Listen', icon: 'volume-2' }] : []), { target: 'settings', label: 'Settings', icon: 'settings' }]).map((item) => <Pressable accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: screen === item.target }} key={item.label} onPress={() => {if (item.target === 'settings') settings();else if (item.target === 'reader') {audio.playing ? audio.stop() : audio.listen(current.start, current.end, slow ? 0.8 : 1);} else if (item.target === 'home') go('home');else if (item.target === 'world') go('world');else if (item.target === 'map') go('map');else if (item.target === 'rewards') go('rewards');else go('journal');}} style={s.navItem}><View style={[s.navIcon, { backgroundColor: screen === item.target ? '#faf9f6' : 'transparent' }]}><Icon name={item.icon === 'home' ? 'home' : item.icon === 'map' ? 'map' : item.icon === 'coins' ? 'coins' : item.icon === 'navigation' ? 'navigation' : item.icon === 'volume-2' ? 'volume-2' : item.icon === 'settings' ? 'settings' : 'book-open'} color={screen === item.target ? t.primary : '#faf9f6'} size={24} /></View><Text style={[s.text, { color: '#faf9f6', fontSize: 12, lineHeight: lineFor(12) }]}>{item.label}</Text></Pressable>)}</View>}
    {saveFailed && <View style={s.toast}><Text style={[s.text, { color: '#fff' }]}>This browser cannot save progress. Keep this tab open while testing.</Text></View>}{notice.length > 0 && <View accessibilityLiveRegion="polite" style={[s.toast, { bottom: host.safeArea.bottom + 90 }]}><Text style={[s.text, { color: '#fff', fontSize: 14, lineHeight: lineFor(14) }]}>{notice}</Text></View>}
  </View></UIProvider>;
}
