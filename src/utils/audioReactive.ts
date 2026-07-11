// 动态背景消费的音频状态  所有[0,1]
export interface AudioReactiveState {
  // 低频平滑能量，用于驱动大范围流体形变
  bass: number
  // 中频平滑能量，用于驱动局部流动
  mid: number
  // 高频平滑能量，用于驱动细微高光
  treble: number
  // 检测到低频瞬态的短促脉冲
  beat: number
  // 上一帧原始低频能量，计算瞬态变化
  previousBass: number
  // 低频瞬态的自适应基线，用于避免持续低音反复触发节拍。
  beatBaseline: number
}

// 将数值限制到指定范围
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// 按时间平滑数值,rate越大追随目标越快
function smoothValue(
  current: number,
  target: number,
  rate: number,
  elapsedSeconds: number,
): number {
  const progress = 1 - Math.exp(-rate * elapsedSeconds)
  return current + (target - current) * progress
}

// 创建音频响应状态的初始值
export function createAudioReactiveState(): AudioReactiveState {
  return {
    bass: 0,
    mid: 0,
    treble: 0,
    beat: 0,
    previousBass: 0,
    beatBaseline: 0,
  }
}

// 计算指令频率范围内 RMS 能量
export function getBandEnergy(
  data: Uint8Array,
  sampleRate: number,
  startFrequency: number,
  endFrequency: number,
): number {
  if (!data.length || !Number.isFinite(sampleRate) || sampleRate <= 0) return 0

  const nyquistFrequency = sampleRate / 2
  const minimum = clamp(Math.min(startFrequency, endFrequency), 0, nyquistFrequency)
  const maximum = clamp(Math.max(startFrequency, endFrequency), 0, nyquistFrequency)

  if (maximum <= minimum) return 0

  const startIndex = Math.max(1, Math.ceil((minimum / nyquistFrequency) * data.length))
  const endIndex = Math.min(data.length - 1, Math.floor((maximum / nyquistFrequency) * data.length))

  if (endIndex <= startIndex) return 0

  let squreTotal = 0

  for (let index = startIndex; index <= endIndex; index++) {
    const normalizedValue = (data[index] || 0) / 255
    squreTotal += normalizedValue ** 2
  }

  return Math.sqrt(squreTotal / (endIndex - startIndex + 1))
}

// 将一帧 FFT 数据映射为平滑频段和节拍脉冲
// 持续的低音只会抬高 bass；只有低频突然增强才会触发 beat。
export function updateAudioReactiveState(
  state: AudioReactiveState,
  data: Uint8Array,
  sampleRate: number,
  elapsedSeconds: number,
): AudioReactiveState {
  const delta = clamp(elapsedSeconds, 0, 0.5)
  const bassRaw = getBandEnergy(data, sampleRate, 35, 180)
  const midRaw = getBandEnergy(data, sampleRate, 180, 2400)
  const trebleRaw = getBandEnergy(data, sampleRate, 2400, 9000)

  const bass = smoothValue(state.bass, bassRaw, bassRaw > state.bass ? 24 : 5, delta)
  const mid = smoothValue(state.mid, midRaw, midRaw > state.mid ? 18 : 4, delta)
  const treble = smoothValue(state.treble, trebleRaw, trebleRaw > state.treble ? 16 : 3, delta)



  
  const bassFlux = Math.max(0, bassRaw - state.previousBass)
  const beatBaseline = smoothValue(state.beatBaseline, bassFlux, 1.2, delta)

  // 真实音乐的逐帧低频增量通常远小于 1，降低最低阈值以识别中等鼓点。
  const beatThreshold = Math.max(0.012, beatBaseline * 1.35)

  // 将约 0.18 的有效低频增量映射为完整视觉脉冲。
  // 不再使用接近 1 的分母，否则真实鼓点只能得到极小的 beat。
  const beatResponseRange = 0.18
  const beatTarget = clamp((bassFlux - beatThreshold) / beatResponseRange, 0, 1)

  // 快速进入、缓慢退出，形成短促但肉眼可见的色块闪动。
  const beat = smoothValue(state.beat, beatTarget, beatTarget > state.beat ? 50 : 4.8, delta)

  return {
    bass,
    mid,
    treble,
    beat,
    previousBass: bassRaw,
    beatBaseline,
  }
}
