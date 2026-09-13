import type { DeviceModel } from '../types/sequence';

export interface MotionParamDef {
  key: string;
  cc: number;
  /** Parameters that cannot be motion-recorded on hardware (still sendable as live CC). */
  motionRecordable: boolean;
}

export interface DeviceProfile {
  id: DeviceModel;
  labelKey: string;
  /** Max simultaneous voices the device can usefully accept during real-time rec. */
  maxVoices: number;
  /** Keys-only Flux fine timing. */
  supportsFlux: boolean;
  /** Bass hardware has 3 oscillator parts; MIDI notes cannot target them independently. */
  oscillatorLanes: number;
  oscillatorMidiIndependent: boolean;
  motionParams: MotionParamDef[];
  sysexSupported: boolean;
  midiOutSupported: boolean;
  patternSlots: number;
  notes: string[];
}

/** Official MIDI Implementation Chart (2013.06.10) — System Exclusive: none. */
export const KEYS_MOTION_PARAMS: MotionParamDef[] = [
  { key: 'portamento', cc: 5, motionRecordable: true },
  { key: 'expression', cc: 11, motionRecordable: false },
  { key: 'voice', cc: 40, motionRecordable: false },
  { key: 'octave', cc: 41, motionRecordable: false },
  { key: 'detune', cc: 42, motionRecordable: true },
  { key: 'vcoEgInt', cc: 43, motionRecordable: true },
  { key: 'cutoff', cc: 44, motionRecordable: true },
  { key: 'vcfEgInt', cc: 45, motionRecordable: true },
  { key: 'lfoRate', cc: 46, motionRecordable: true },
  { key: 'lfoPitchInt', cc: 47, motionRecordable: true },
  { key: 'lfoCutoffInt', cc: 48, motionRecordable: true },
  { key: 'egAttack', cc: 49, motionRecordable: true },
  { key: 'egDecayRelease', cc: 50, motionRecordable: true },
  { key: 'egSustain', cc: 51, motionRecordable: true },
  { key: 'delayTime', cc: 52, motionRecordable: true },
  { key: 'delayFeedback', cc: 53, motionRecordable: true },
];

/** Official MIDI Implementation Chart (2013.06.10) — System Exclusive: none. */
export const BASS_MOTION_PARAMS: MotionParamDef[] = [
  { key: 'slideTime', cc: 5, motionRecordable: false },
  { key: 'expression', cc: 11, motionRecordable: false },
  { key: 'octave', cc: 40, motionRecordable: false },
  { key: 'lfoRate', cc: 41, motionRecordable: true },
  { key: 'lfoInt', cc: 42, motionRecordable: true },
  { key: 'vcoPitch1', cc: 43, motionRecordable: true },
  { key: 'vcoPitch2', cc: 44, motionRecordable: true },
  { key: 'vcoPitch3', cc: 45, motionRecordable: true },
  { key: 'egAttack', cc: 46, motionRecordable: true },
  { key: 'egDecayRelease', cc: 47, motionRecordable: true },
  { key: 'cutoffEgInt', cc: 48, motionRecordable: true },
  { key: 'gateTime', cc: 49, motionRecordable: false },
];

export const DEVICE_PROFILES: Record<DeviceModel, DeviceProfile> = {
  keys: {
    id: 'keys',
    labelKey: 'device.keys',
    maxVoices: 3,
    supportsFlux: true,
    oscillatorLanes: 1,
    oscillatorMidiIndependent: false,
    motionParams: KEYS_MOTION_PARAMS,
    sysexSupported: false,
    midiOutSupported: false,
    patternSlots: 8,
    notes: [
      'noSysEx',
      'noMidiOut',
      'realtimeRecTransfer',
      'fluxFineTiming',
      'peakNotMidi',
    ],
  },
  bass: {
    id: 'bass',
    labelKey: 'device.bass',
    maxVoices: 1,
    supportsFlux: false,
    oscillatorLanes: 3,
    oscillatorMidiIndependent: false,
    motionParams: BASS_MOTION_PARAMS,
    sysexSupported: false,
    midiOutSupported: false,
    patternSlots: 8,
    notes: [
      'noSysEx',
      'noMidiOut',
      'realtimeRecTransfer',
      'oscillatorsNotIndependent',
      'cutoffPeakNotMidi',
    ],
  },
};

export const getDeviceProfile = (device: DeviceModel): DeviceProfile => DEVICE_PROFILES[device];

export const motionParamCount = (device: DeviceModel) => getDeviceProfile(device).motionParams.length;
