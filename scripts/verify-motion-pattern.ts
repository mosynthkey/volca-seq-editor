import { createMotionPattern } from '../src/utils/motionPatterns';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const up = createMotionPattern('linearUp', { min: 0, max: 127 });
assert(up.length === 16, 'length');
assert(up[0] === 0, 'linearUp start');
assert(up[15] === 127 || up[15] >= 119, 'linearUp end');

const down = createMotionPattern('linearDown', { min: 10, max: 100 });
assert(down[0] >= down[8], 'linearDown descends');

const sine = createMotionPattern('sine', { min: 0, max: 127, cycles: 2 });
assert(sine[0] === 0, 'sine starts at min');

console.log('verify-motion-pattern: ok');
