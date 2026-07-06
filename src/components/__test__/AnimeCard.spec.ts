import { expect, it, describe } from 'vitest'
import AnimeCard from '../AnimeCard.vue'
import type { Anime } from '@/types/anime'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { RouterLink } from 'vue-router'

// 测试用Anime对象
function createAnime(overrides: Partial<Anime> = {}): Anime {
  return {
    id: 1,
    title: 'Test Anime',
    coverImage: 'https://example.com/test.jpg',
    averageScore: 8.5,
    episodes: 12,
    ...overrides,
  }
}

describe('AnimeCard', () => {
  it('渲染番剧标题', () => {
    const anime = createAnime({ title: 'My Anime' })
    const wrapper = mount(AnimeCard, {
      props: {
        anime,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })
    expect(wrapper.text()).toContain('My Anime')
  })

  it('渲染评分和集数',()=>{
    const anime= createAnime()
    const wrapper= mount(AnimeCard,{
      props:{
        anime,
      },
      global:{
        stubs:{
          RouterLink:RouterLinkStub,}
      }
    })

    expect(wrapper.text()).toContain('8.5分')
    expect(wrapper.text()).toContain('12 集')
  })

  it('缺少评分和集数时不显示文本',()=>{
    const anime= createAnime({averageScore:undefined,episodes:undefined})
    const wrapper= mount(AnimeCard,{
      props:{
        anime,
      },
      global:{
        stubs:{
          RouterLink:RouterLinkStub,}
      }
    })

    expect(wrapper.text()).not.toContain('分')
    expect(wrapper.text()).not.toContain('集')


  })
  it('图片使用正确的src和alt',()=>{
    const anime = createAnime()
    const wrapper = mount(AnimeCard,{
      props:{
        anime,
      },
      global:{
        stubs:{RouterLink:RouterLinkStub,}
      }
    })

    expect(wrapper.find('img').attributes('src')).toBe(anime.coverImage)
    expect(wrapper.find('img').attributes('alt')).toBe(anime.title)
  })

  it('链接指向正确的详情页',()=>{
    const wrapper = mount(AnimeCard,{
      props:{
        anime:createAnime({id:42})
      },
      global:{
        stubs:{RouterLink:RouterLinkStub,}
      }
    })

    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/anime/42')
  })








})
