<template>
  <div class="staff-tab" style="margin-top: 60px;">
    <div class="credits-roll">
      <div v-for="n in 2" :key="'copy-' + n" class="credits-copy">
        <div v-for="group in groupedStaff" :key="n + '-' + group.relation" class="credits-group">
          <h3 class="relation-title">{{ group.relation }}</h3>
          <div class="names">
            <span
              v-for="(person, index) in group.persons"
              :key="n + '-' + group.relation + '-' + index"
            >
              {{ person.staff.nameCN||person.staff.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="StaffTab">
import { getStaffById } from '@/api/bangumi'
import { watch, ref, computed } from 'vue'

const props = defineProps<{ anime: { id: number } }>()
const staff = ref<{ positions: Array<any>; staff: { nameCN: string } }[]>([])

watch(
  () => props.anime?.id,
  async (id) => {
    if (!id) return
    try {
      const res = await getStaffById(id)
      staff.value = res.data.data || []
      console.log(staff.value)
    } catch (e) {
      console.error(e)
    }
  },
  { immediate: true },
)

const groupedStaff = computed(() => {
  const map = new Map<string, any[]>()
  for (const item of staff.value) {
    const relation = item.positions[0]!.type?.cn || '其他'
    if (!map.has(relation)) map.set(relation, [])
    map.get(relation)!.push(item)
  }
  return Array.from(map.entries()).map(([relation, persons]) => ({
    relation,
    persons,
  }))
})
</script>

<style scoped>
.staff-tab {
  height: 1000px;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}
.credits-copy {
  padding: 20vh 0 30vh;
  text-align: center;
}
.credits-roll {
  animation: credits-scroll 42s linear infinite;
  text-align: center;
}

.credits-group {
  margin-bottom: 48px;
}

.relation-title {
  font-size: 14px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.names {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 24px;
  font-size: 20px;
  color: var(--text-main);
}

.names span {
  white-space: nowrap;
}

@keyframes credits-scroll {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(-60%);
  }
}
</style>
