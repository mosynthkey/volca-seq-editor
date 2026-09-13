<template>
  <v-dialog :model-value="sequence.showTransferDialog" max-width="480" persistent>
    <v-card>
      <v-card-title>{{ t('sequence.transfer') }}</v-card-title>
      <v-card-text>
        <p>{{ t('sequence.transferHint') }}</p>
        <v-row dense class="mt-2">
          <v-col cols="6">
            <v-text-field
              v-model.number="sequence.transferLoops"
              :label="t('sequence.loops')"
              type="number"
              min="1"
              max="8"
              density="compact"
              :disabled="midi.transferring"
            />
          </v-col>
        </v-row>
        <p v-if="sequence.transferStatus === 'countdown'">{{ t('sequence.transferCountdown') }}</p>
        <p v-else-if="sequence.transferStatus === 'sending'">{{ t('sequence.transferSending') }}</p>
        <p v-else-if="sequence.transferStatus === 'done'">{{ t('sequence.transferDone') }}</p>
        <p v-if="sequence.transferSummary" class="text-medium-emphasis">{{ sequence.transferSummary }}</p>
        <p v-if="sequence.transferError" class="text-error">{{ sequence.transferError }}</p>
        <v-progress-linear
          :model-value="sequence.transferProgress"
          color="primary"
          height="8"
          rounded
          class="mt-3"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="midi.transferring"
          color="error"
          variant="tonal"
          @click="sequence.stopTransfer()"
        >
          {{ t('sequence.transferStop') }}
        </v-btn>
        <template v-else>
          <v-btn variant="text" @click="close">{{ t('common.close') }}</v-btn>
          <v-btn
            v-if="sequence.transferStatus !== 'done'"
            color="primary"
            :disabled="!midi.hasOutput"
            @click="sequence.startRealtimeTransfer()"
          >
            {{ t('sequence.transfer') }}
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMidiStore } from '@/stores/midiStore'
import { useSequencerStore } from '@/stores/sequencerStore'

const { t } = useI18n()
const midi = useMidiStore()
const sequence = useSequencerStore()

const close = () => {
  sequence.showTransferDialog = false
  sequence.transferStatus = 'idle'
  sequence.transferProgress = 0
}
</script>
