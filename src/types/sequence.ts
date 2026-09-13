/** Shared sequencer constants for volca keys / bass (16-step loop). */
export const NUM_OF_STEPS = 16;
export const MIDI_PPQN = 24;
/** 16 steps spanning 4 quarter notes → 96 MIDI clocks per pattern. */
export const MIDI_CLOCKS_PER_STEP = 6;
export const MIDI_CLOCKS_PER_PATTERN = NUM_OF_STEPS * MIDI_CLOCKS_PER_STEP;
export const MOTION_POINT_COUNT = 5;

export type DeviceModel = 'keys' | 'bass';

export interface SequenceNote {
  pitch: number;
  startStep: number;
  length: number;
  velocity: number;
  gatePercent: number;
  /** Tick offset within the start step (0 .. clocksPerStep-1). Used for Keys Flux. */
  tickOffset: number;
  /** Bass: which virtual oscillator lane this note belongs to (0–2). MIDI cannot address VCOs separately. */
  oscillatorLane: number;
}

export interface SequenceFunc {
  motionOn: boolean;
  motionSmooth: boolean;
  /** Keys: record/play without quantizing to step starts. */
  flux: boolean;
  /** Tempo division: 0=1/1, 1=1/2, 2=1/4 of the knob / clock tempo. */
  tempo: number;
  /** Bass: slide flag per step (sent as CC5 Slide Time when recording). */
  slideEnabled: boolean;
}

export interface SequenceState {
  device: DeviceModel;
  name: string;
  velocity: number;
  gatePercent: number;
  bpm: number;
  midiChannel: number;
  notes: SequenceNote[];
  motionEnabled: boolean[];
  motionStepEnabled: boolean[][];
  motionValues: number[][][];
  stepOn: boolean[];
  activeStep: boolean[];
  /** Bass: per-step slide on/off (hardware-style). */
  slideStep: boolean[];
  func: SequenceFunc;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

export const createBoolRow = (value = true): boolean[] =>
  Array.from({ length: NUM_OF_STEPS }, () => value);

export const createMotionPoints = (value = 64): number[] =>
  Array.from({ length: MOTION_POINT_COUNT }, () => clamp(value, 0, 127));

export const createSequenceNote = (
  pitch: number,
  startStep: number,
  length: number,
  velocity = 100,
  gatePercent = 80,
  tickOffset = 0,
  oscillatorLane = 0,
): SequenceNote => ({
  pitch: clamp(pitch, 0, 127),
  startStep: clamp(startStep, 0, NUM_OF_STEPS - 1),
  length: Math.max(1, length),
  velocity: clamp(velocity, 1, 127),
  gatePercent: clamp(gatePercent, 0, 100),
  tickOffset: Math.max(0, tickOffset),
  oscillatorLane: clamp(oscillatorLane, 0, 2),
});

export const createEmptyFunc = (): SequenceFunc => ({
  motionOn: false,
  motionSmooth: false,
  flux: false,
  tempo: 0,
  slideEnabled: false,
});

export const noteAbsoluteTick = (note: SequenceNote): number =>
  note.startStep * MIDI_CLOCKS_PER_STEP + note.tickOffset;

export const noteEndTick = (note: SequenceNote): number => {
  const start = noteAbsoluteTick(note);
  const durationClocks = Math.max(
    1,
    Math.round((note.length - 1) * MIDI_CLOCKS_PER_STEP + (note.gatePercent / 100) * MIDI_CLOCKS_PER_STEP),
  );
  return start + durationClocks;
};
