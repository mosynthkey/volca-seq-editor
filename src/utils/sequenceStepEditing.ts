import { NUM_OF_STEPS, type SequenceNote, type SequenceState } from '@/types/sequence';
import { createSequenceNote } from '@/types/sequence';
import { euclideanHits, rotationAligningHitToStep } from '@/utils/euclidean';

export const clearSequenceStep = (state: SequenceState, step: number): SequenceState => ({
  ...state,
  notes: state.notes.filter(note =>
    !(note.startStep <= step && note.startStep + note.length - 1 >= step)),
});

export const copySequenceStep = (state: SequenceState, fromStep: number, toStep: number): SequenceState => {
  if (fromStep === toStep) return state;
  const sourceNotes = state.notes.filter(note => note.startStep === fromStep);
  const withoutTarget = state.notes.filter(note => note.startStep !== toStep);
  const copied = sourceNotes.map(note => createSequenceNote(
    note.pitch,
    toStep,
    Math.min(note.length, NUM_OF_STEPS - toStep),
    note.tickOffset,
  ));
  return { ...state, notes: [...withoutTarget, ...copied] };
};

export const copyNotesEuclid = (
  notes: SequenceNote[],
  source: SequenceNote,
  pulses: number,
): SequenceNote[] => {
  const rotation = rotationAligningHitToStep(NUM_OF_STEPS, pulses, source.startStep);
  const hits = euclideanHits(NUM_OF_STEPS, pulses, rotation);
  const without = notes.filter(note =>
    !(note.pitch === source.pitch && hits.includes(note.startStep)));
  const copies = hits.map(step => createSequenceNote(
    source.pitch,
    step,
    Math.min(source.length, NUM_OF_STEPS - step),
    source.tickOffset,
  ));
  return [...without, ...copies];
};

export const shiftSteps = (state: SequenceState, delta: number): SequenceState => {
  const shift = ((delta % NUM_OF_STEPS) + NUM_OF_STEPS) % NUM_OF_STEPS;
  if (!shift) return state;
  const rotateBool = (row: boolean[]) =>
    Array.from({ length: NUM_OF_STEPS }, (_, step) => row[(step - shift + NUM_OF_STEPS) % NUM_OF_STEPS]);
  return {
    ...state,
    notes: state.notes.map(note => createSequenceNote(
      note.pitch,
      (note.startStep + shift) % NUM_OF_STEPS,
      Math.min(note.length, NUM_OF_STEPS - ((note.startStep + shift) % NUM_OF_STEPS)),
      note.tickOffset,
    )),
    stepOn: rotateBool(state.stepOn),
  };
};
