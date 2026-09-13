import {
  createBoolRow,
  createEmptyFunc,
  createMotionPoints,
  createSequenceNote,
  MOTION_POINT_COUNT,
  NUM_OF_STEPS,
  type DeviceModel,
  type SequenceFunc,
  type SequenceNote,
  type SequenceState,
} from './sequence';
import { motionParamCount } from '../midi/deviceProfiles';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

export { createMotionPoints, MOTION_POINT_COUNT };

export const createMotionGrid = (device: DeviceModel, fill = 64): number[][][] =>
  Array.from({ length: motionParamCount(device) }, () =>
    Array.from({ length: NUM_OF_STEPS }, () => createMotionPoints(fill)));

export const createMotionStepEnabled = (device: DeviceModel, value = true): boolean[][] =>
  Array.from({ length: motionParamCount(device) }, () => createBoolRow(value));

const asBoolRow = (raw: unknown, fallback: boolean): boolean[] => {
  if (!Array.isArray(raw)) return createBoolRow(fallback);
  return createBoolRow(fallback).map((_, stepIndex) =>
    (typeof raw[stepIndex] === 'boolean' ? raw[stepIndex] : fallback));
};

const asMotionStepEnabled = (device: DeviceModel, raw: unknown): boolean[][] => {
  const count = motionParamCount(device);
  if (!Array.isArray(raw)) return createMotionStepEnabled(device, true);
  return Array.from({ length: count }, (_, paramIndex) => asBoolRow(raw[paramIndex], true));
};

const asMotionValues = (device: DeviceModel, raw: unknown): number[][][] => {
  const grid = createMotionGrid(device, 64);
  if (!Array.isArray(raw)) return grid;
  for (let paramIndex = 0; paramIndex < grid.length; paramIndex++) {
    const row = raw[paramIndex];
    if (!Array.isArray(row)) continue;
    for (let stepIndex = 0; stepIndex < NUM_OF_STEPS; stepIndex++) {
      const cell = row[stepIndex];
      if (Array.isArray(cell)) {
        grid[paramIndex][stepIndex] = createMotionPoints(64).map((_, pointIndex) =>
          clamp(Number(cell[pointIndex] ?? cell[0] ?? 64) || 0, 0, 127));
      } else if (typeof cell === 'number') {
        grid[paramIndex][stepIndex] = createMotionPoints(cell);
      }
    }
  }
  return grid;
};

export const normalizeSequenceState = (
  raw: Partial<SequenceState> | null | undefined,
  fallbackDevice: DeviceModel = 'keys',
): SequenceState => {
  const device = raw?.device === 'bass' || raw?.device === 'keys' ? raw.device : fallbackDevice;
  const velocity = clamp(raw?.velocity ?? 100, 1, 127);
  const gatePercent = clamp(raw?.gatePercent ?? 80, 0, 100);
  const funcRaw: Partial<SequenceFunc> = raw?.func ?? {};
  return {
    device,
    name: typeof raw?.name === 'string' ? raw.name : '',
    velocity,
    gatePercent,
    bpm: clamp(raw?.bpm ?? 120, 10, 600),
    midiChannel: clamp(raw?.midiChannel ?? 1, 1, 16),
    notes: (raw?.notes ?? []).map((note: SequenceNote) => createSequenceNote(
      note.pitch,
      note.startStep,
      note.length,
      note.velocity ?? velocity,
      note.gatePercent ?? gatePercent,
      note.tickOffset ?? 0,
      note.oscillatorLane ?? 0,
    )),
    motionEnabled: Array.from({ length: motionParamCount(device) }, (_, paramIndex) =>
      Boolean(raw?.motionEnabled?.[paramIndex])),
    motionStepEnabled: asMotionStepEnabled(device, raw?.motionStepEnabled),
    motionValues: asMotionValues(device, raw?.motionValues),
    stepOn: asBoolRow(raw?.stepOn, true),
    activeStep: asBoolRow(raw?.activeStep, true),
    slideStep: asBoolRow(raw?.slideStep, false),
    func: {
      ...createEmptyFunc(),
      ...funcRaw,
      motionOn: funcRaw.motionOn ?? Boolean(raw?.motionEnabled?.some(Boolean)),
      tempo: clamp(funcRaw.tempo ?? 0, 0, 2),
      flux: device === 'keys' ? Boolean(funcRaw.flux) : false,
    },
  };
};

export const createEmptySequenceState = (device: DeviceModel = 'keys'): SequenceState =>
  normalizeSequenceState({ device });

export const resizeMotionForDevice = (state: SequenceState, device: DeviceModel): SequenceState => {
  if (state.device === device
    && state.motionEnabled.length === motionParamCount(device)
    && state.motionValues.length === motionParamCount(device)) {
    return state;
  }
  return normalizeSequenceState({ ...state, device }, device);
};

export type { SequenceNote };
