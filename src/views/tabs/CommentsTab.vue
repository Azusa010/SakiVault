<template>
  <div class="comments-tab w">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <CommentCard v-for="c in comments" :key="c.id" :comment="c" class="comment-card"/>
      <div v-if="!comments.length" class="empty">暂无吐槽</div>
      <br><br><hr style="filter: brightness(0.5);"><br><h3 style="color: #aaa; text-align: center;">到底了</h3><br>
    </template>
  </div>
</template>

<script setup lang="ts" name="">
import { getCommentsById } from '@/api/bangumi'
import { ref, watch } from 'vue'
import CommentCard from '@/components/CommentCard.vue'
import { type Comment } from '@/types/anime'

const props = defineProps<{ anime: { id: number } }>()

const comments = ref<Comment[]>([])
const loading = ref(false)
const error = ref('')

watch(
  () => props.anime?.id,
  async (id) => {
    if (!id) return
    loading.value = true
    error.value = ''
    try {
      const res = await getCommentsById(id)
      comments.value = res.data || []
    } catch (e) {
      error.value = '加载失败'
      console.log(e)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.loading,
.error,
.empty {
  text-align: center;
  padding: 24px;
  opacity: 0.6;
}
.error {
  color: #ff6b6b;
}
.comment-card:first-child {
  margin-top: 30px;
}
</style>
