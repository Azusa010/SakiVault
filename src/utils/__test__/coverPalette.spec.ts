import { describe, expect, it } from 'vitest'
import { selectPaletteColors } from '../coverPalette'

describe('coverPalette', () => {
  it('按颜色面积保留主次顺序，并返回归一化占比', () => {
    const palette = selectPaletteColors([
      { color: { red: 32, green: 38, blue: 44 }, score: 100 },
      { color: { red: 216, green: 198, blue: 233 }, score: 30 },
      { color: { red: 71, green: 120, blue: 177 }, score: 60 },
      { color: { red: 255, green: 218, blue: 132 }, score: 10 },
    ])

    expect(palette.colors).toEqual([
      { red: 32, green: 38, blue: 44 },
      { red: 71, green: 120, blue: 177 },
      { red: 216, green: 198, blue: 233 },
    ])
    expect(palette.weights[0]).toBeCloseTo(100 / 190)
    expect(palette.weights[1]).toBeCloseTo(60 / 190)
    expect(palette.weights[2]).toBeCloseTo(30 / 190)
  })

  it('限制小面积点缀色的背景权重', () => {
    const palette = selectPaletteColors([
      { color: { red: 24, green: 30, blue: 36 }, score: 900 },
      { color: { red: 44, green: 92, blue: 148 }, score: 90 },
      { color: { red: 245, green: 62, blue: 88 }, score: 10 },
    ])

    expect(palette.weights[2]).toBeLessThanOrEqual(0.1)
    expect(palette.weights.reduce((total, weight) => total + weight, 0)).toBeCloseTo(1)
  })

  it('将多个近似黑色桶合并，并保留封面中的肤色和蓝绿色', () => {
    const palette = selectPaletteColors([
      // 同一个暗色族产生的三个量化桶。
      { color: { red: 16, green: 16, blue: 16 }, score: 600 },
      { color: { red: 16, green: 16, blue: 48 }, score: 160 },
      { color: { red: 48, green: 16, blue: 16 }, score: 120 },

      // 同一个肤色族产生的两个量化桶。
      { color: { red: 176, green: 128, blue: 96 }, score: 100 },
      { color: { red: 208, green: 160, blue: 128 }, score: 60 },

      // 同一个蓝绿色族产生的两个量化桶。
      { color: { red: 48, green: 112, blue: 128 }, score: 70 },
      { color: { red: 80, green: 144, blue: 160 }, score: 30 },
    ])

    // 三个暗色桶只能产生一个调色板位置。
    expect(palette.colors).toHaveLength(3)

    // 第一种颜色仍然是面积最大的暗色族。
    expect(palette.colors[0]).toEqual({
      red: 20,
      green: 16,
      blue: 22,
    })

    // 另外两个位置必须留给肤色族和蓝绿色族。
    expect(palette.colors[1]).toEqual({
      red: 188,
      green: 140,
      blue: 108,
    })
    expect(palette.colors[2]).toEqual({
      red: 58,
      green: 122,
      blue: 138,
    })

    // 合并后仍然保留各颜色族的真实面积关系。
    expect(palette.weights[0]).toBeCloseTo(880 / 1140)
    expect(palette.weights[1]).toBeCloseTo(160 / 1140)
    expect(palette.weights[2]).toBeCloseTo(100 / 1140)
  })
})
