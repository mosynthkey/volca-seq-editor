import { buildRealtimeTransferEvents, countTransferSummary } from '../src/midi/realtimeTransfer';
import { createEmptySequenceState } from '../src/types/sequenceFactory';
import { createSequenceNote } from '../src/types/sequence';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const state = createEmptySequenceState('keys');
state.bpm = 120;
state.midiChannel = 1;
state.notes = [
  createSequenceNote(60, 0, 1, 100, 80, 0),
  createSequenceNote(64, 4, 2, 100, 50, 2),
];
state.func.flux = true;
state.stepOn[0] = true;
state.stepOn[4] = true;

const events = buildRealtimeTransferEvents(state, { loops: 1 });
const summary = countTransferSummary(events);

assert(events[0]?.bytes[0] === 0xfa, 'starts with MIDI Start');
assert(events.some(event => event.bytes[0] === 0xfc), 'includes Stop');
assert(summary.clocks === 96, `expected 96 clocks, got ${summary.clocks}`);
assert(summary.noteOns === 2, `expected 2 note ons, got ${summary.noteOns}`);
assert(!events.some(event => (event.bytes[0] & 0xf0) === 0xb0), 'no CC events in transfer');

const muted = createEmptySequenceState('keys');
muted.notes = [createSequenceNote(60, 0, 1, 100, 80, 0)];
muted.stepOn[0] = false;
const mutedEvents = buildRealtimeTransferEvents(muted, { loops: 1 });
const mutedSummary = countTransferSummary(mutedEvents);
assert(mutedSummary.noteOns === 0, 'muted stepOn skips notes');

const bass = createEmptySequenceState('bass');
bass.notes = [
  createSequenceNote(36, 0, 1, 100, 80, 0),
  createSequenceNote(40, 4, 1, 100, 80, 0),
];
const bassEvents = buildRealtimeTransferEvents(bass, { loops: 1 });
const bassSummary = countTransferSummary(bassEvents);
assert(bassSummary.noteOns === 2, 'bass transfers all notes');
assert(bassSummary.clocks === 96, 'bass uses standard 96 clocks (no tempo stretch)');

console.log('verify-realtime-transfer: ok');
