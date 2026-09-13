import {
  createBoolRow,
  createEmptyFunc,
  createSequenceNote,
  type DeviceModel,
  type SequenceFunc,
  type SequenceNote,
  type SequenceState,
} from './sequence';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

const asBoolRow = (raw: unknown, fallback: boolean): boolean[] => {
  if (!Array.isArray(raw)) return createBoolRow(fallback);
  return createBoolRow(fallback).map((_, stepIndex) =>
    (typeof raw[stepIndex] === 'boolean' ? raw[stepIndex] : fallback));
};

export const normalizeSequenceState = (
  raw: Partial<SequenceState> | null | undefined,
  fallbackDevice: DeviceModel = 'keys',
): SequenceState => {
  const device = raw?.device === 'bass' || raw?.device === 'keys' ? raw.device : fallbackDevice;
  const funcRaw: Partial<SequenceFunc> = raw?.func ?? {};
  return {
    device,
    name: typeof raw?.name === 'string' ? raw.name : '',
    bpm: clamp(raw?.bpm ?? 120, 10, 600),
    midiChannel: clamp(raw?.midiChannel ?? 1, 1, 16),
    notes: (raw?.notes ?? []).map((note: SequenceNote) => createSequenceNote(
      note.pitch,
      note.startStep,
      note.length,
      note.tickOffset ?? 0,
    )),
    stepOn: asBoolRow(raw?.stepOn, true),
    func: {
      ...createEmptyFunc(),
      flux: device === 'keys' ? Boolean(funcRaw.flux) : false,
    },
  };
};

export const createEmptySequenceState = (device: DeviceModel = 'keys'): SequenceState =>
  normalizeSequenceState({ device });

export const resizeStateForDevice = (state: SequenceState, device: DeviceModel): SequenceState => {
  if (state.device === device) return state;
  return normalizeSequenceState({ ...state, device }, device);
};

export type { SequenceNote };
