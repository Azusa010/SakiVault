<template>
  <div class="w character-tab" style="margin-top: 25px">
    <CharacterCard
      v-for="char in sortedCharacters"
      :key="char.id"
      :character-id="char.id"
      :actors="char.actors"
      @select="selectedCharacter = $event"
    />
    <CharacterDetailSheet :character="selectedCharacter" @close="selectedCharacter = null" />
  </div>
</template>

<script setup lang="ts" name="CharactersTab">
import { watch, ref, computed } from 'vue'
import { getCharactersById } from '@/api/bangumi'
import CharacterCard from '@/components/CharacterCard.vue'
import CharacterDetailSheet from '@/components/CharacterDetailSheet.vue'
const props = defineProps<{ anime: { id: number } }>()
const selectedCharacter = ref<{
  name: string
  gender: string
  birth_year: number | null
  birth_mon: number | null
  birth_day: number | null
  images: {
    medium: string
  }
  summary: string
  infobox: { key: string; value: string | string[] }[]
} | null>(null)
const charactersIds = ref<{ actors: []; id: number; relation: string }[]>([])
const loading = ref(false)
const error = ref('')

watch(
  () => props.anime?.id,
  async (id) => {
    if (!id) return
    loading.value = true
    error.value = ''
    try {
      const res = await getCharactersById(id)
      charactersIds.value =
        res.data.map((item: { actors: []; id: number; relation: string }) => {
          return { actors: item.actors, id: item.id, relation: item.relation }
        }) || []
    } catch (e) {
      error.value = '加载失败'
      console.error(e)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const RELATION_ORDER: Record<string, number> = {
  主角: 1,
  配角: 2,
}
const DEFAULT_ORDER = 3

function getRelationOrder(relation: string): number {
  return RELATION_ORDER[relation] || DEFAULT_ORDER
}

const sortedCharacters = computed(() => {
  return [...charactersIds.value].sort((a, b) => {
    return getRelationOrder(a.relation) - getRelationOrder(b.relation)
  })
})
</script>

<style scoped>
.character-tab {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .character-tab {
    display: flex;
    flex-direction: column;
  }
}
</style>
