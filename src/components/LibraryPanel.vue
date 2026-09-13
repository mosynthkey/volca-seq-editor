<template>
  <div class="panel side-card">
    <div class="library-header">
      <h3>{{ t('sequence.library') }}</h3>
      <v-btn size="x-small" variant="tonal" :title="t('sequence.saveLibrary')" @click="saveCurrent">
        <Save :size="14" class="btn-icon" />
        {{ t('sequence.saveLibrary') }}
      </v-btn>
    </div>
    <p v-if="!library.items.length" class="hint-banner" style="border:0;padding:0">
      {{ t('library.empty') }}
    </p>
    <div v-for="item in library.items" :key="item.id" class="library-item">
      <div>
        <strong>{{ item.state.name || 'Untitled' }}</strong>
        <div class="muted">{{ item.state.device }} · {{ formatDate(item.savedAt) }}</div>
      </div>
      <div class="library-actions">
        <v-btn size="x-small" variant="text" :title="t('library.load')" @click="loadItem(item.id)">
          <FolderOpen :size="14" class="btn-icon" />
          {{ t('library.load') }}
        </v-btn>
        <v-btn size="x-small" variant="text" color="error" :title="t('library.delete')" @click="library.remove(item.id)">
          <Trash2 :size="14" class="btn-icon" />
          {{ t('library.delete') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FolderOpen, Save, Trash2 } from '@lucide/vue'
import { useLibraryStore } from '@/stores/libraryStore'
import { useSequencerStore } from '@/stores/sequencerStore'

const { t } = useI18n()
const library = useLibraryStore()
const sequence = useSequencerStore()

const saveCurrent = () => {
  library.save(sequence.toState())
}

const loadItem = (id: string) => {
  const item = library.items.find(entry => entry.id === id)
  if (item) sequence.loadFromState(item.state)
}

const formatDate = (value: number) =>
  new Date(value).toLocaleString()
</script>

<style scoped>
.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.library-header h3 {
  margin: 0;
}
.library-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(196, 165, 116, 0.12);
}
.muted {
  color: var(--volca-muted);
  font-size: 11px;
}
.library-actions {
  display: flex;
  gap: 2px;
}
.btn-icon {
  margin-right: 4px;
  flex-shrink: 0;
}
</style>
