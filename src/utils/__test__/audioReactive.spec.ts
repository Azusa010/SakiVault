import { describe, it, expect } from 'vitest'
import { createAudioReactiveState, getBandEnergy, updateAudioReactiveState } from '../audioReactive'

describe('audioReactive', () => {
  it('能从指定频段读取能量，且不会把低频判断成中频', () => {
    const data = new Uint8Array(1024)

    // 48kHz 采样率下，索引 2、3 约对应 47Hz、70Hz。
    data[2] = 255
    data[3] = 255

    expect(getBandEnergy(data, 48000, 40, 160)).toBeGreaterThan(0.45)
    expect(getBandEnergy(data, 48000, 300, 2000)).toBe(0)
  })

  it('低频突增时产生节拍脉冲，并在安静后自然衰减', () => {
    const quiet = new Uint8Array(1024)
    const kick = new Uint8Array(1024)

    kick[2] = 255
    kick[3] = 255
    kick[4] = 255

    let state = createAudioReactiveState()

    // 先建立安静时自适应基线
    for (let index = 0; index < 24; index++) {
      state = updateAudioReactiveState(state, quiet, 48000, 1 / 60)
    }

    const afterKick = updateAudioReactiveState(state, kick, 48000, 1 / 60)
    const afterRelease = updateAudioReactiveState(afterKick, quiet, 48000, 0.3)

    expect(afterKick.bass).toBeGreaterThan(state.bass)
    expect(afterKick.beat).toBeGreaterThan(0.35)
    expect(afterRelease.beat).toBeLessThan(afterKick.beat)
  })

  it('能在持续低频中识别幅度适中的真实鼓点', () => {
    /** 创建指定强度的低频频谱帧。 */
    function createBassFrame(strength: number): Uint8Array {
      const data = new Uint8Array(1024)

      // 48kHz、1024 个频率桶时，这些位置覆盖主要低频区域。
      for (let index = 2; index <= 7; index++) {
        data[index] = strength
      }

      return data
    }

    const steadyBass = createBassFrame(90)
    const kickBass = createBassFrame(125)

    let state = createAudioReactiveState()

    // 先模拟持续存在的伴奏低频，而不是从完全静音开始。
    for (let index = 0; index < 30; index++) {
      state = updateAudioReactiveState(state, steadyBass, 48000, 1 / 60)
    }

    const beforeKick = state
    const afterKick = updateAudioReactiveState(beforeKick, kickBass, 48000, 1 / 60)
    const afterSteady = updateAudioReactiveState(afterKick, kickBass, 48000, 0.3)

    // 中等幅度的低频突增也应该产生清晰可用的视觉脉冲。
    expect(afterKick.beat).toBeGreaterThan(0.25)

    // 低频保持不变后不能持续触发节拍。
    expect(afterSteady.beat).toBeLessThan(afterKick.beat)
  })
})
