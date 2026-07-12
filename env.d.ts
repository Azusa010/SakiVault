/// <reference types="vite/client" />

import type {
  KazumiSourceRule,
  KazumiRuleSummary,
  AnimeSourceCheckResult,
} from '@/utils/sourceRule'
import type {
  AnimeSourceSearchResult,
  AnimeSourceEpisodeRoute,
  AnimeStreamSource,
} from '@/utils/xpathParser'

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean
      searchAnime: (rule: KazumiSourceRule, keyword: string) => Promise<AnimeSourceSearchResult[]>
      listAnimeRules: () => Promise<KazumiRuleSummary[]>
      loadAnimeRule: (name: string) => Promise<KazumiSourceRule>
      loadAnimeEpisodes: (
        rule: KazumiSourceRule,
        resultUrl: string,
      ) => Promise<AnimeSourceEpisodeRoute[]>
      resolveAnimeStream: (episodeUrl: string) => Promise<AnimeStreamSource>
      checkAnimeSources: (keyword: string) => Promise<AnimeSourceCheckResult[]>
      onAnimeSourceChecked: (listener: (result: AnimeSourceCheckResult) => void) => () => void
    }
  }
}
