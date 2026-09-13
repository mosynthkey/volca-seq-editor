import { euclideanHits, euclideanPattern, rotationAligningHitToStep } from '../src/utils/euclidean';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(euclideanHits(16, 0).length === 0, '0 pulses');
assert(euclideanHits(16, 4).join(',') === '0,4,8,12', '4 pulses on 16');
assert(euclideanPattern(8, 3).filter(Boolean).length === 3, 'pattern hit count');
assert(rotationAligningHitToStep(16, 4, 4) === 4, 'rotation align');

console.log('verify-euclidean: ok');
