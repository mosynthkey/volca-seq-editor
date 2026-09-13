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
state.func.motionOn = true;
state.motionEnabled[6] = true; // cutoff
state.motionValues[6][0][0] = 90;
state.motionStepEnabled[6][0] = true;

const events = buildRealtimeTransferEvents(state, { loops: 1, includeMotion: true });
const summary = countTransferSummary(events);

assert(events[0]?.bytes[0] === 0xfa, 'starts with MIDI Start');
assert(events.some(event => event.bytes[0] === 0xfc), 'includes Stop');
assert(summary.clocks === 96, `expected 96 clocks, got ${summary.clocks}`);
assert(summary.noteOns === 2, `expected 2 note ons, got ${summary.noteOns}`);
assert(summary.ccs >= 1, 'expected motion CC');

const bass = createEmptySequenceState('bass');
bass.notes = [
  createSequenceNote(36, 0, 1, 100, 80, 0, 0),
  createSequenceNote(40, 0, 1, 100, 80, 0, 1),
];
const bassEvents = buildRealtimeTransferEvents(bass, { bassLane: 0 });
const bassSummary = countTransferSummary(bassEvents);
assert(bassSummary.noteOns === 1, 'bass transfers selected lane only');

console.log('verify-realtime-transfer: ok');
