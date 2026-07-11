import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MusicBackground from '../MusicBackground.vue'
import { createAudioReactiveState } from '@/utils/audioReactive.ts'

describe('MusicBackground', () => {
  it('渲染不参与无障碍阅读的背景画布，并反映播放状态', () => {
    const wrapper = mount(MusicBackground, {
      props: {
        coverUrl: 'https://example.com/cover.jpg',
        audio: createAudioReactiveState(),
        isPlaying: true,
      },
    })

    expect(wrapper.get('canvas').attributes('aria-hidden')).toBe('true')
    expect(wrapper.classes()).toContain('is-playing')
  })

  it('菲活动状态不标记为动态渲染背景',()=>{
    const wrapper = mount(MusicBackground,{
      props:{
        coverUrl: 'https://example.com/cover.jpg',
        audio: createAudioReactiveState(),
        isPlaying: true,
        isActive: true,
      },
    })

    expect(wrapper.classes()).toContain('is-active')
  })
})
