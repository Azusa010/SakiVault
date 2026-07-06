import { test, expect } from '@playwright/test'

// 模拟Bangumi返回的列表
const mockBangumiList = {
  data: [
    {
      id: 1,
      name: 'Mock Anime 1',
      name_cn: '测试番剧 1',
      eps: 12,
      rating: { score: 8.5 },
      collection: {
        wish: 1010,
        collect: 200,
        doing: 50,
        on_hold: 10,
        dropped: 5,
      },
    },
    {
      id: 2,
      name: 'Mock Anime 2',
      name_cn: '测试番剧 2',
      eps: 24,
      rating: { score: 9.0 },
      collection: {
        wish: 50,
        collect: 300,
        doing: 30,
        on_hold: 5,
        dropped: 2,
      },
    },
  ],
}


test.beforeEach(async ({page}) => {
  // 拦截Bangumi API请求并返回模拟数据
  await page.route(/https:\/\/api\.bgm\.tv\/v0\/subjects\?/,async (route) =>{
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBangumiList),
    })
  })
  // 拦截图片请求
  await page.route('https://api.bgm.tv/v0/subjects/*/images**', async (route)=>{
    await route.abort('aborted')
  })
})


test('首页加载并且显示番剧列表',async({page}) => {
  await page.goto('/')

  // 断言页面标题
  await expect(page.locator('h1.hero-title')).toHaveText('SakiVault')

  // 等待卡片出现
  const cards = page.locator('.anime-card')
  await expect(cards).toHaveCount(4)

  // 断言页面标题
  await expect(cards.first()).toContainText('测试番剧 1')
} )
