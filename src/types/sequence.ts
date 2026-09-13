/** Shared sequencer constants for volca keys / bass (16-step loop). */
export const NUM_OF_STEPS = 16;
export const MIDI_PPQN = 24;
/** 16 steps spanning 4 quarter notes → 96 MIDI clocks per pattern. */
export const MIDI_CLOCKS_PER_STEP = 6;
export const MIDI_CLOCKS_PER_PATTERN = NUM_OF_STEPS * MIDI_CLOCKS_PER_STEP;
/** Fixed Note On velocity for REAL TIME REC (no per-note velocity editing). */
export const DEFAULT_NOTE_VELOCITY = 100;

export type DeviceModel = 'keys' | 'bass';

export interface SequenceNote {
  pitch: number;
  startStep: number;
  length: number;
  /** Tick offset within the start step (0 .. clocksPerStep-1). Used for Keys Flux. */
  tickOffset: number;
}

export interface SequenceFunc {
  /** Keys: record/play without quantizing to step starts. Requires Flux ON on the device. */
  flux: boolean;
}

export interface SequenceState {
  device: DeviceModel;
  name: string;
  bpm: number;
  midiChannel: number;
  notes: SequenceNote[];
  /** Mute for transfer (no Note On). Editor convenience — not hardware Active Step. */
  stepOn: boolean[];
  func: SequenceFunc;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

export const createBoolRow = (value = true): boolean[] =>
  Array.from({ length: NUM_OF_STEPS }, () => value);

export const createSequenceNote = (
  pitch: number,
  startStep: number,
  length: number,
  tickOffset = 0,
): SequenceNote => ({
  pitch: clamp(pitch, 0, 127),
  startStep: clamp(startStep, 0, NUM_OF_STEPS - 1),
  length: Math.max(1, length),
  tickOffset: Math.max(0, tickOffset),
});

export const createEmptyFunc = (): SequenceFunc => ({
  flux: false,
});

export const noteAbsoluteTick = (note: SequenceNote): number =>
  note.startStep * MIDI_CLOCKS_PER_STEP + note.tickOffset;

export const noteEndTick = (note: SequenceNote): number =>
  noteAbsoluteTick(note) + Math.max(1, note.length * MIDI_CLOCKS_PER_STEP);
