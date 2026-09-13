import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MidiTransport } from '@/midi/midiTransport';

export const useMidiStore = defineStore('midi', () => {
  const transport = new MidiTransport(message => {
    logs.value = [...logs.value.slice(-200), message];
  });
  const ready = ref(false);
  const error = ref<string | null>(null);
  const inputNames = ref<string[]>([]);
  const outputNames = ref<string[]>([]);
  const selectedOutput = ref<string | null>(null);
  const logs = ref<string[]>([]);
  const transferring = ref(false);

  const refreshPorts = () => {
    inputNames.value = transport.inputNames();
    outputNames.value = transport.outputNames();
    if (selectedOutput.value && !outputNames.value.includes(selectedOutput.value)) {
      selectedOutput.value = outputNames.value[0] ?? null;
    } else if (!selectedOutput.value) {
      selectedOutput.value = outputNames.value[0] ?? null;
    }
  };

  const initialize = async () => {
    error.value = null;
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API is not available in this browser.');
      }
      await transport.initialize();
      transport.bindStateChange(() => refreshPorts());
      refreshPorts();
      ready.value = true;
      logs.value = [...logs.value, 'MIDI access ready.'];
    } catch (caught) {
      ready.value = false;
      error.value = caught instanceof Error ? caught.message : String(caught);
    }
  };

  const send = (bytes: Uint8Array | number[]) =>
    transport.send(selectedOutput.value, bytes);

  const sendAt = (bytes: Uint8Array | number[], timestamp: number) =>
    transport.sendAt(selectedOutput.value, bytes, timestamp);

  const hasOutput = computed(() => Boolean(selectedOutput.value));

  return {
    ready,
    error,
    inputNames,
    outputNames,
    selectedOutput,
    logs,
    transferring,
    hasOutput,
    initialize,
    refreshPorts,
    send,
    sendAt,
  };
});
