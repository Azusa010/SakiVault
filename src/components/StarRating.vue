<template>
  <span class="star-rating">
    <span class="stars-empty">
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-Filled_Star"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-Filled_Star"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-Filled_Star"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-Filled_Star"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-Filled_Star"></use>
      </svg>
    </span>
    <span class="stars-full" :style="{ width: percentage }">
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-shoucang-yishoucang"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-shoucang-yishoucang"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-shoucang-yishoucang"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-shoucang-yishoucang"></use>
      </svg>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-shoucang-yishoucang"></use>
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts" name="StarRating">
const props = defineProps(['score'])
const percentage = `${Math.min(100, Math.max(0, props.score * 10))}%`
</script>
<style scoped>
.star-rating {
  width: 100px;
  position: relative;
  display: inline-block;
  font-size: 20px;
  letter-spacing: 2px;
}

.stars-empty {
  display: inline-block;
  visibility: visible;
}

.stars-full {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
}
</style>
