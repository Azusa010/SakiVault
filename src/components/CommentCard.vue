<template>
  <div class="comment-card">
    <img :src="comment.user.avatar.medium" :alt="comment.user.nickname" class="avatar" />
    <div class="body">
      <div
        class="name"
        style="display: flex; align-items: flex-end; gap: 0px; margin: -4px 0 2px 0"
      >
        {{ comment.user.nickname
        }}<span style="font-size: 14px; color: #aaa">@{{ type(comment.type) }}</span>
      </div>
      <div class="comment-time" style="color: rgba(255, 255, 255, 0.6)">
        {{ formatRelativeTime(comment.updatedAt) }}
      </div>
      <div class="comment-content">{{ comment.comment }}</div>
      <StarRating :score="comment.rate" style="transform: scale(0.9)" />
    </div>
  </div>
</template>

<script setup lang="ts" name="">
import { type Comment } from '@/types/anime'
import StarRating from './StarRating.vue'
import { formatRelativeTime } from '@/utils/time'
import { type } from '@/utils/comType.ts'

defineProps<{ comment: Comment }>()
</script>

<style scoped>
.comment-card {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 14px 14px 14px 14px;
  border-radius: 10px;
  align-items: flex-start;
  width: 100%;
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.02);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
}
.comment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.02));
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
.star-rating {
  position: absolute;
  right: 50px;
}
.body {
  min-width: 0;
  display: grid;
}
.name {
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
}
.comment-time {
  font-size: 15px;
}
.comment-content {
  margin-top: 6px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 6.5em;
  overflow: hidden;
}
@media (max-width: 480px) {
  .comment-card {
    padding: 10px;
    gap: 10px;
  }
  .avatar {
    width: 40px;
    height: 40px;
  }
  .name {
    font-size: 13px;
  }
  .content {
    font-size: 13px;
  }
  .comment-card:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
