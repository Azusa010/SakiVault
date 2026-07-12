/// <reference types="vite/client" />

import type { KazumiSourceRule,KazumiRuleSummary } from '@/utils/sourceRule'
import type { AnimeSourceSearchResult } from '@/utils/xpathParser'

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean
      searchAnime: (rule: KazumiSourceRule, keyword: string) => Promise<AnimeSourceSearchResult[]>
      listAnimeRules: () => Promise<KazumiRuleSummary[]>
      loadAnimeRule: (name: string) => Promise<KazumiSourceRule>
    }
  }
}
