/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
import plans from './story-plans.json';

// Mnemonic proposals, not translations or claims about historical locations.
// Keep canonical Gurbani and supplied English meaning beside these cues.



const pauriOneStops = [
{ place: 'The pool', cue: 'Washing and inner clarity', x: 0, reflection: 'The water is our reminder to return to this line about outward washing and the mind.' },
{ place: 'The quiet grove', cue: 'Silence and inner stillness', x: 0.187, reflection: 'The quiet grove reminds us that outer silence and inner stillness are not the same.' },
{ place: 'The grain store', cue: 'Hunger and possessions', x: 0.433, reflection: 'The gathered grain helps us recall the line about hunger and piling up worldly goods.' },
{ place: 'The winding maze', cue: 'Cleverness and its limits', x: 0.647, reflection: 'The many paths are a memory cue for the line about clever tricks and their limits.' },
{ place: 'The misty threshold', cue: 'The question of truthful living', x: 0.847, reflection: 'At the threshold, pause with the question this line asks. The mist is only a visual cue.' },
{ place: 'The open path', cue: 'Walking in Hukam', x: 1, reflection: 'The path continues into the same world. Return to the full line and its meaning about Hukam.' }];


// Zero-based, inclusive ranges keep repeated refrains and related lines together.
const firstStory = {
  title: 'The open path',
  image: 'pauri-1-calm.jpg',
  stops: pauriOneStops.map((stop, index) => ({ ...stop, start: index, end: index }))
};

const plansByPauri = plans;

/** The memory walk for a pauri, or undefined where no landscape is painted yet. */
export function storyForPauri(number) {
  return number === 1 ? firstStory : plansByPauri[String(number)];
}

export function storyStopForLine(story, line) {
  return story.stops.find((stop) => line >= stop.start && line <= stop.end) ?? story.stops[0];
}

/** Kept for the Pauri 1 walk, which is referenced directly in places. */
export const pauriOneStory = firstStory.stops;
