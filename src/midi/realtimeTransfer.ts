import {
  MIDI_CLOCKS_PER_PATTERN,
  MIDI_CLOCKS_PER_STEP,
  MIDI_PPQN,
  noteAbsoluteTick,
  noteEndTick,
  type SequenceNote,
  type SequenceState,
} from '../types/sequence';

export interface ScheduledMidiEvent {
  tick: number;
  bytes: number[];
  label: string;
}

const channelStatus = (status: number, channel: number) =>
  (status & 0xf0) | ((channel - 1) & 0x0f);

/**
 * Build a pattern event list for REAL TIME REC.
 * Sends MIDI Start, Clock, and Note On/Off only.
 * Motion / Active Step / Slide / Tempo FUNC cannot be written via MIDI.
 */
export const buildRealtimeTransferEvents = (
  state: SequenceState,
  options: { loops?: number } = {},
): ScheduledMidiEvent[] => {
  const loops = Math.max(1, options.loops ?? 1);
  const channel = state.midiChannel;
  const patternTicks = MIDI_CLOCKS_PER_PATTERN;
  const events: ScheduledMidiEvent[] = [];

  events.push({ tick: 0, bytes: [0xfa], label: 'start' });

  const notes = state.notes.filter(note => state.stepOn[note.startStep]);

  for (let loopIndex = 0; loopIndex < loops; loopIndex++) {
    const loopOffset = loopIndex * patternTicks;
    for (const note of notes) {
      scheduleNote(events, note, channel, loopOffset, state.func.flux);
    }
  }

  for (let clockTick = 0; clockTick < patternTicks * loops; clockTick++) {
    events.push({ tick: clockTick, bytes: [0xf8], label: 'clock' });
  }

  events.push({ tick: patternTicks * loops, bytes: [0xfc], label: 'stop' });

  return events.sort((left, right) => {
    if (left.tick !== right.tick) return left.tick - right.tick;
    return eventPriority(left) - eventPriority(right);
  });
};

const eventPriority = (event: ScheduledMidiEvent) => {
  const status = event.bytes[0];
  if (status === 0xfa) return 0;
  if ((status & 0xf0) === 0x90) return 1;
  if ((status & 0xf0) === 0x80) return 2;
  if (status === 0xf8) return 3;
  if (status === 0xfc) return 4;
  return 5;
};

const scheduleNote = (
  events: ScheduledMidiEvent[],
  note: SequenceNote,
  channel: number,
  loopOffset: number,
  flux: boolean,
) => {
  const startTick = flux
    ? loopOffset + noteAbsoluteTick(note)
    : loopOffset + note.startStep * MIDI_CLOCKS_PER_STEP;
  const endTick = flux
    ? loopOffset + noteEndTick(note)
    : loopOffset + note.startStep * MIDI_CLOCKS_PER_STEP
      + Math.max(1, Math.round(note.length * MIDI_CLOCKS_PER_STEP * (note.gatePercent / 100)));

  events.push({
    tick: startTick,
    bytes: [channelStatus(0x90, channel), note.pitch & 0x7f, note.velocity & 0x7f],
    label: `noteOn ${note.pitch}`,
  });
  events.push({
    tick: Math.max(startTick + 1, endTick),
    bytes: [channelStatus(0x80, channel), note.pitch & 0x7f, 0x40],
    label: `noteOff ${note.pitch}`,
  });
};

export const tickToMs = (tick: number, bpm: number) =>
  (tick * (60_000 / bpm)) / MIDI_PPQN;

export const countTransferSummary = (events: ScheduledMidiEvent[]) => {
  let clocks = 0;
  let noteOns = 0;
  for (const event of events) {
    const status = event.bytes[0];
    if (status === 0xf8) clocks++;
    else if ((status & 0xf0) === 0x90 && (event.bytes[2] ?? 0) > 0) noteOns++;
  }
  return { clocks, noteOns, total: events.length };
};
