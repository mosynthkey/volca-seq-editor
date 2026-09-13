import { getDeviceProfile } from './deviceProfiles';
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
 * Build a one-pattern (or multi-bar via tempo division) event list for REAL TIME REC.
 * Sends MIDI Start, Clock, Note On/Off, and optional motion CCs.
 */
export const buildRealtimeTransferEvents = (
  state: SequenceState,
  options: {
    loops?: number;
    includeMotion?: boolean;
    /** Bass: which oscillator lane to send as notes (others ignored for Note On). */
    bassLane?: number;
  } = {},
): ScheduledMidiEvent[] => {
  const loops = Math.max(1, options.loops ?? 1);
  const includeMotion = options.includeMotion ?? true;
  const bassLane = options.bassLane ?? 0;
  const channel = state.midiChannel;
  const profile = getDeviceProfile(state.device);
  const tempoDiv = state.func.tempo === 1 ? 2 : state.func.tempo === 2 ? 4 : 1;
  const patternTicks = MIDI_CLOCKS_PER_PATTERN * tempoDiv;
  const events: ScheduledMidiEvent[] = [];

  events.push({ tick: 0, bytes: [0xfa], label: 'start' });

  const notes = state.notes.filter(note => {
    if (!state.activeStep[note.startStep] || !state.stepOn[note.startStep]) return false;
    if (state.device === 'bass') return note.oscillatorLane === bassLane;
    return true;
  });

  for (let loopIndex = 0; loopIndex < loops; loopIndex++) {
    const loopOffset = loopIndex * patternTicks;
    for (const note of notes) {
      scheduleNote(events, note, channel, loopOffset, state.func.flux);
    }
    if (includeMotion && state.func.motionOn) {
      scheduleMotion(events, state, profile.motionParams, loopOffset);
    }
    if (state.device === 'bass' && state.func.slideEnabled) {
      scheduleBassSlide(events, state, loopOffset);
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
  if ((status & 0xf0) === 0xb0) return 1;
  if ((status & 0xf0) === 0x90) return 2;
  if ((status & 0xf0) === 0x80) return 3;
  if (status === 0xf8) return 4;
  if (status === 0xfc) return 5;
  return 6;
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

const scheduleMotion = (
  events: ScheduledMidiEvent[],
  state: SequenceState,
  motionParams: { cc: number; motionRecordable: boolean }[],
  loopOffset: number,
) => {
  const channel = state.midiChannel;
  for (let paramIndex = 0; paramIndex < motionParams.length; paramIndex++) {
    if (!state.motionEnabled[paramIndex]) continue;
    const param = motionParams[paramIndex];
    if (!param.motionRecordable && !state.func.motionOn) continue;
    for (let stepIndex = 0; stepIndex < state.motionStepEnabled[paramIndex].length; stepIndex++) {
      if (!state.motionStepEnabled[paramIndex][stepIndex]) continue;
      if (!state.activeStep[stepIndex]) continue;
      const points = state.func.motionSmooth
        ? state.motionValues[paramIndex][stepIndex]
        : [state.motionValues[paramIndex][stepIndex][0]];
      const pointCount = points.length;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
        const tick = loopOffset
          + stepIndex * MIDI_CLOCKS_PER_STEP
          + Math.floor((pointIndex * MIDI_CLOCKS_PER_STEP) / pointCount);
        events.push({
          tick,
          bytes: [
            channelStatus(0xb0, channel),
            param.cc & 0x7f,
            points[pointIndex] & 0x7f,
          ],
          label: `cc${param.cc}`,
        });
      }
    }
  }
};

const scheduleBassSlide = (
  events: ScheduledMidiEvent[],
  state: SequenceState,
  loopOffset: number,
) => {
  const channel = state.midiChannel;
  for (let stepIndex = 0; stepIndex < state.slideStep.length; stepIndex++) {
    if (!state.slideStep[stepIndex] || !state.activeStep[stepIndex]) continue;
    events.push({
      tick: loopOffset + stepIndex * MIDI_CLOCKS_PER_STEP,
      bytes: [channelStatus(0xb0, channel), 5, 90],
      label: 'slideOn',
    });
    events.push({
      tick: loopOffset + stepIndex * MIDI_CLOCKS_PER_STEP + MIDI_CLOCKS_PER_STEP - 1,
      bytes: [channelStatus(0xb0, channel), 5, 0],
      label: 'slideOff',
    });
  }
};

/** Convert MIDI clock ticks to DOMHighResTimeStamp offsets from transfer start. */
export const tickToMs = (tick: number, bpm: number) =>
  (tick * (60_000 / bpm)) / MIDI_PPQN;

export const countTransferSummary = (events: ScheduledMidiEvent[]) => {
  let clocks = 0;
  let noteOns = 0;
  let ccs = 0;
  for (const event of events) {
    const status = event.bytes[0];
    if (status === 0xf8) clocks++;
    else if ((status & 0xf0) === 0x90 && (event.bytes[2] ?? 0) > 0) noteOns++;
    else if ((status & 0xf0) === 0xb0) ccs++;
  }
  return { clocks, noteOns, ccs, total: events.length };
};
