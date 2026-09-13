import { DEVICE_PROFILES, getDeviceProfile } from '../src/midi/deviceProfiles';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(!DEVICE_PROFILES.keys.sysexSupported, 'keys has no SysEx');
assert(!DEVICE_PROFILES.bass.sysexSupported, 'bass has no SysEx');
assert(!DEVICE_PROFILES.keys.midiOutSupported, 'keys has no MIDI Out');
assert(!DEVICE_PROFILES.bass.midiOutSupported, 'bass has no MIDI Out');
assert(DEVICE_PROFILES.keys.supportsFlux, 'keys supports Flux');
assert(!DEVICE_PROFILES.bass.supportsFlux, 'bass has no Flux');
assert(DEVICE_PROFILES.keys.maxVoices === 3, 'keys max voices');
assert(DEVICE_PROFILES.bass.maxVoices === 1, 'bass max voices');

const keysCutoff = getDeviceProfile('keys').controlChanges.find(param => param.key === 'cutoff');
assert(keysCutoff?.cc === 44, 'keys cutoff CC44');

const bassPitch2 = getDeviceProfile('bass').controlChanges.find(param => param.key === 'vcoPitch2');
assert(bassPitch2?.cc === 44, 'bass VCO2 pitch CC44');

assert(
  DEVICE_PROFILES.keys.notes.includes('motionNotViaMidi'),
  'keys documents motion not via MIDI',
);
assert(
  DEVICE_PROFILES.bass.notes.includes('slideNotViaMidi'),
  'bass documents slide not via MIDI',
);

console.log('verify-device-profile: ok');
console.log('SysEx investigation: official MIDI Implementation Charts list System Exclusive as empty for both keys and bass.');
