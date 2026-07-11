// RGB 颜色，三个通道范围均为 0 到 255。
export interface RgbColor {
  red: number
  green: number
  blue: number
}

// 颜色及其在封面中出现的重要程度。
export interface PaletteCandidate {
  color: RgbColor
  score: number
}

// 供背景着色器使用的颜色及其封面面积占比。
export interface PaletteSelection {
  colors: RgbColor[]
  weights: number[]
}

// 聚合后的颜色族，score 是整个颜色族包含的像素数量。
interface ColorCluster {
  color: RgbColor
  score: number
}

/** 计算两个 RGB 颜色之间的欧氏距离。 */
function getColorDistance(first: RgbColor, second: RgbColor): number {
  return Math.hypot(
    first.red - second.red,
    first.green - second.green,
    first.blue - second.blue,
  )
}

/** 计算 RGB 颜色的感知亮度，范围为 0 到 255。 */
function getBrightness({ red, green, blue }: RgbColor): number {
  return (red * 299 + green * 587 + blue * 114) / 1000
}

/**
 * 判断两个量化颜色是否属于同一个视觉颜色族。
 * 暗部会产生大量略有差异的黑色桶，因此暗色使用更宽松的合并规则。
 */
function belongsToSameFamily(first: RgbColor, second: RgbColor): boolean {
  const firstBrightness = getBrightness(first)
  const secondBrightness = getBrightness(second)

  // 两个颜色都很暗时，统一视为同一个暗色族，避免前三名全部是近似黑色。
  if (firstBrightness < 68 && secondBrightness < 68) {
    return true
  }

  return getColorDistance(first, second) < 72
}

/**
 * 按原有像素数量更新颜色族中心。
 * 使用加权平均能让最终颜色代表整个颜色族，而不是第一个量化桶。
 */
function mergeIntoCluster(cluster: ColorCluster, candidate: PaletteCandidate): void {
  const totalScore = cluster.score + candidate.score

  cluster.color = {
    red: Math.round(
      (cluster.color.red * cluster.score + candidate.color.red * candidate.score) / totalScore,
    ),
    green: Math.round(
      (cluster.color.green * cluster.score + candidate.color.green * candidate.score) / totalScore,
    ),
    blue: Math.round(
      (cluster.color.blue * cluster.score + candidate.color.blue * candidate.score) / totalScore,
    ),
  }

  cluster.score = totalScore
}

/**
 * 将相似量化桶合并为颜色族。
 * 例如多个黑色桶会合并为一个暗色族，肤色和蓝绿色仍会分别保留。
 */
function createColorClusters(candidates: PaletteCandidate[]): ColorCluster[] {
  const clusters: ColorCluster[] = []

  const sortedCandidates = [...candidates]
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score)

  for (const candidate of sortedCandidates) {
    const matchingCluster = clusters.find((cluster) =>
      belongsToSameFamily(cluster.color, candidate.color),
    )

    if (matchingCluster) {
      mergeIntoCluster(matchingCluster, candidate)
      continue
    }

    clusters.push({
      color: { ...candidate.color },
      score: candidate.score,
    })
  }

  return clusters.sort((first, second) => second.score - first.score)
}

/**
 * 按封面实际面积选择视觉上不同的颜色族，并返回归一化占比。
 * 相近颜色会先合并，避免黑色封面选出的三个颜色全部接近黑色。
 */
export function selectPaletteColors(
  candidates: PaletteCandidate[],
  maximumCount = 3,
): PaletteSelection {
  const clusters = createColorClusters(candidates)
  const selected: ColorCluster[] = []

  for (const cluster of clusters) {
    const isVisuallyDistinct = selected.every(
      (existing) => !belongsToSameFamily(existing.color, cluster.color),
    )

    if (!isVisuallyDistinct) continue

    selected.push(cluster)

    if (selected.length === maximumCount) break
  }

  const totalScore = selected.reduce((total, cluster) => total + cluster.score, 0)

  if (totalScore <= 0) {
    return {
      colors: [],
      weights: [],
    }
  }

  return {
    colors: selected.map((cluster) => cluster.color),
    weights: selected.map((cluster) => cluster.score / totalScore),
  }
}
