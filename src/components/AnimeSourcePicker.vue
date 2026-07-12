<template>
  <Teleport to="body">
    <Transition name="source-picker">
      <div v-if="open" class="source-picker-mask" @click.self="emit('close')">
        <section class="source-picker" role="dialog">
          <header class="source-picker-header">
            <div>
              <p>观看来源</p>
              <h2>选择一个来源开始搜索</h2>
            </div>
            <button type="button" class="close-button" @click="emit('close')">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </header>

          <p v-if="!isDesktop" class="source-picker-message">
            视频来源解析仅支持 Electron 桌面端。
          </p>

          <p v-else-if="isLoading" class="source-picker-message">正在加载规则库</p>
          <p v-else-if="errorMessage" class="source-picker-message is-error">{{ errorMessage }}</p>

          <div v-else class="source-list">
            <button v-for="rule in rules" :key="rule.name" type="button" class="source-item" :class="`is-${getSourceState(rule.name)}`" :disabled="getSourceState(rule.name)!=='available'" @click="selectSource(rule.name)">
              <span class="source-name">
                <i class="status-light"></i>
                {{ rule.name }}
              </span>
              <small>{{ getSourceHint(rule) }}</small>
            </button>
          </div>
          <p v-if="isChecking" class="source-picker-message">正在检测来源{{ checkedCount }}/{{ rules.length }}</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts" name="AnimeSourcePicker">
import { computed, ref, watch ,onBeforeUnmount } from 'vue'
import type { KazumiRuleSummary , AnimeSourceCheckResult} from '@/utils/sourceRule'

type SourceState = AnimeSourceCheckResult['status'] | 'pending'

const props = defineProps<{ open: boolean,keyword: string }>()

const emit = defineEmits<{ close: []; select: [ruleName: string] }>()

// 从KazumiRules 加载到的规则摘要
const rules = ref<KazumiRuleSummary[]>([])

// 每个来源当前的检测状态
const sourceStates = ref<Record<string, SourceState>>({})

// 每个来源的搜索结果数量
const resultCounts = ref<Record<string, number>>({})

// 规则库加载状态
const isLoading = ref(false)

// 批量检测状态
const isChecking = ref(false)

// 规则库加载失败信息
const errorMessage = ref('')

// 当前环境是否具有Electron观看能力
const isDesktop = computed(() => window.electronAPI?.isDesktop === true)

// 已完成检测来源数量
const checkedCount = computed(()=>{
  return Object.values(sourceStates.value).filter(state => state !== 'pending').length
})


//读取规则库列表
async function loadRules(): Promise<void> {
  if (!isDesktop.value || rules.value.length > 0) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    rules.value = await window.electronAPI!.listAnimeRules()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '规则库加载失败'
  } finally {
    isLoading.value = false
  }
}


//返回来源当前状态，尚未收到结果pending
function getSourceState(ruleName: string):SourceState{
  return sourceStates.value[ruleName] ?? 'pending'
}

function getSourceHint(rule:KazumiRuleSummary):string{
  const state = getSourceState(rule.name)

  if(state === 'pending') return '检测中...'
  if(state === 'available') return `找到${resultCounts.value[rule.name]??0}个结果`
  return '未找到结果'
}


// 只有检测到才允许进入观看
function selectSource(ruleName:string):void{
  if(getSourceState(ruleName) === 'available') emit('select',ruleName)
}

// 初始化状态并启动并发检测
async function checkSources():Promise<void>{
  await loadRules()

  if(!window.electronAPI || rules.value.length===0||!props.keyword) return
  sourceStates.value = Object.fromEntries(rules.value.map(rule=>[rule.name,'pending']))
  resultCounts.value = {}
  errorMessage.value = ''
  isChecking.value = true

  const unsubscribe = window.electronAPI.onAnimeSourceChecked(result=>{
    sourceStates.value[result.name] = result.status
    resultCounts.value[result.name] = result.resultCount
  })

  try {
    await window.electronAPI.checkAnimeSources(props.keyword)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '来源检测失败'
  }finally{
    isChecking.value = false
  }
}

// 弹层打开时再加载规则，避免详情页初始化时产生额外请求。
watch(
  () => props.open,
  (open) => {
    if (open) void checkSources()
  },
)

onBeforeUnmount(()=>{

})
</script>

<style scoped>
.source-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 7, 14, 0.65);
  backdrop-filter: blur(10px);
}

.source-picker {
  width: min(560px, 100%);
  max-height: min(680px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  background: rgba(21, 27, 42, 0.92);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
}

.source-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
}

.source-picker-header p {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 0.85rem;
}

.source-picker-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.08);
  font-size: 1.4rem;
  cursor: pointer;
}

.source-picker-message {
  padding: 12px 24px 28px;
  margin: 0;
  color: var(--text-muted);
}

.source-picker-message.is-error {
  color: #ff9aac;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 460px;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.source-item:hover {
  border-color: rgba(0, 255, 204, 0.45);
  background: rgba(0, 255, 204, 0.1);
}

.source-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-item small {
  color: var(--text-muted);
}

.source-picker-enter-active,
.source-picker-leave-active {
  transition: opacity 0.2s ease;
}

.source-picker-enter-active .source-picker,
.source-picker-leave-active .source-picker {
  transition: transform 0.2s ease;
}

.source-picker-enter-from,
.source-picker-leave-to {
  opacity: 0;
}

.source-picker-enter-from .source-picker,
.source-picker-leave-to .source-picker {
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 520px) {
  .source-list {
    grid-template-columns: 1fr;
  }
}

.source-item:disabled {
  cursor: not-allowed;
}

.source-item.is-pending {
  opacity: 0.65;
}

.source-item.is-unavailable {
  opacity: 0.5;
}

.source-item.is-available {
  border-color: rgba(68, 220, 145, 0.5);
  background: rgba(68, 220, 145, 0.08);
}

.source-item.is-available:hover {
  border-color: rgba(68, 220, 145, 0.9);
  background: rgba(68, 220, 145, 0.16);
}

.source-name {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-light {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8d96a8;
}

.is-available .status-light {
  background: #44dc91;
  box-shadow: 0 0 10px rgba(68, 220, 145, 0.8);
}

.is-unavailable .status-light {
  background: #ff637d;
  box-shadow: 0 0 10px rgba(255, 99, 125, 0.7);
}

.is-pending .status-light {
  animation: source-checking 1s ease-in-out infinite alternate;
}

@keyframes source-checking {
  to {
    opacity: 0.35;
  }
}
</style>
