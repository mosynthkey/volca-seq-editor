import type { DeviceModel } from '../types/sequence';

export interface ControlChangeDef {
  key: string;
  cc: number;
  notes?: string;
}

export interface DeviceProfile {
  id: DeviceModel;
  labelKey: string;
  /** Max simultaneous voices useful during real-time rec. */
  maxVoices: number;
  /** Keys-only Flux fine timing (device Flux must be ON). */
  supportsFlux: boolean;
  /** Reference CC map from the official MIDI Implementation Chart (not written into the sequencer via MIDI). */
  controlChanges: ControlChangeDef[];
  sysexSupported: boolean;
  midiOutSupported: boolean;
  patternSlots: number;
  notes: string[];
}

/** Official MIDI Implementation Chart (2013.06.10) — System Exclusive: none. */
export const KEYS_CONTROL_CHANGES: ControlChangeDef[] = [
  { key: 'portamento', cc: 5 },
  { key: 'expression', cc: 11, notes: 'MIDI-only' },
  { key: 'voice', cc: 40 },
  { key: 'octave', cc: 41 },
  { key: 'detune', cc: 42 },
  { key: 'vcoEgInt', cc: 43 },
  { key: 'cutoff', cc: 44 },
  { key: 'vcfEgInt', cc: 45 },
  { key: 'lfoRate', cc: 46 },
  { key: 'lfoPitchInt', cc: 47 },
  { key: 'lfoCutoffInt', cc: 48 },
  { key: 'egAttack', cc: 49 },
  { key: 'egDecayRelease', cc: 50 },
  { key: 'egSustain', cc: 51 },
  { key: 'delayTime', cc: 52 },
  { key: 'delayFeedback', cc: 53 },
];

/** Official MIDI Implementation Chart (2013.06.10) — System Exclusive: none. */
export const BASS_CONTROL_CHANGES: ControlChangeDef[] = [
  { key: 'slideTime', cc: 5, notes: 'MIDI-only; not per-step Slide' },
  { key: 'expression', cc: 11, notes: 'MIDI-only' },
  { key: 'octave', cc: 40 },
  { key: 'lfoRate', cc: 41 },
  { key: 'lfoInt', cc: 42 },
  { key: 'vcoPitch1', cc: 43 },
  { key: 'vcoPitch2', cc: 44 },
  { key: 'vcoPitch3', cc: 45 },
  { key: 'egAttack', cc: 46 },
  { key: 'egDecayRelease', cc: 47 },
  { key: 'cutoffEgInt', cc: 48 },
  { key: 'gateTime', cc: 49, notes: 'MIDI-only' },
];

export const DEVICE_PROFILES: Record<DeviceModel, DeviceProfile> = {
  keys: {
    id: 'keys',
    labelKey: 'device.keys',
    maxVoices: 3,
    supportsFlux: true,
    controlChanges: KEYS_CONTROL_CHANGES,
    sysexSupported: false,
    midiOutSupported: false,
    patternSlots: 8,
    notes: [
      'noSysEx',
      'noMidiOut',
      'realtimeRecNotesOnly',
      'motionNotViaMidi',
      'activeStepNotMidi',
      'fluxFineTiming',
      'peakNotMidi',
    ],
  },
  bass: {
    id: 'bass',
    labelKey: 'device.bass',
    maxVoices: 1,
    supportsFlux: false,
    controlChanges: BASS_CONTROL_CHANGES,
    sysexSupported: false,
    midiOutSupported: false,
    patternSlots: 8,
    notes: [
      'noSysEx',
      'noMidiOut',
      'realtimeRecNotesOnly',
      'motionNotViaMidi',
      'activeStepNotMidi',
      'slideNotViaMidi',
      'oscillatorsNotIndependent',
      'cutoffPeakNotMidi',
    ],
  },
};

export const getDeviceProfile = (device: DeviceModel): DeviceProfile => DEVICE_PROFILES[device];
