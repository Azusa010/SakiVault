import {describe,it,expect} from 'vitest'
import { mount} from '@vue/test-utils'
import StarRating from '../StarRating.vue'


function rederWithScore(score:number) {
  const wrapper = mount(StarRating,{
    props:{
      score
    }
  })

  return wrapper.find('.stars-full').attributes('style')
}

describe('StarRating',()=>{

  it('score为0时宽度为0',()=>{
    const style = rederWithScore(0)
    expect(style).toContain('width: 0%')
  })

  it('score为5时宽度为50%',()=>{
    const style = rederWithScore(5)
    expect(style).toContain('width: 50%')
  })

  it('score为10时宽度为100%',()=>{
    const style = rederWithScore(10)
    expect(style).toContain('width: 100%')
  })

  it('score小于0时宽度为0',()=>{
    const style = rederWithScore(-5)
    expect(style).toContain('width: 0%')
  })

  it('score大于10时宽度为100%',()=>{
    const style = rederWithScore(15)
    expect(style).toContain('width: 100%')
  })
  

})
