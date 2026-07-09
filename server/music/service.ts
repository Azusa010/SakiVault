import axios from "axios";
import { getLxMusicUrl } from "./lxRuntime";

const API_ENHANCED_BASE_URL = "http://localhost:3000"

// 调用播放地址接口传的params参数
export interface MusicUrlParams {
  id:string,
  name?:string,
  artist?:string,
}

// api-enchanced返回的单挑播放地址结构
interface NeteaseSongUrlItem {
  url:string|null,
  freeTrialInfo: {
    fragmentType?: number,
    start?: number,
    end?: number,
    algData?:{
      fragSource?:string
    }
  } | null,
}


// 后端统一返回给前端的结构
export interface MusicUrlResult{
  id:string,
  url:string|null,
  source: 'netease' | 'lx',
  isPreview: boolean,
}

// 判断api-enhanced返回是否为试听
function isPreviewUrl(item?:NeteaseSongUrlItem){
  return Boolean(item?.freeTrialInfo)
}

// 从api-enhancde获取URL
async function getNeteaseUrl(id:number){
  const response = await axios.get(`${API_ENHANCED_BASE_URL}/song/url/v1`,{
    params:{
      id,
      level:'exhigh'
    }
  })
  return response.data.data?.[0] as NeteaseSongUrlItem | undefined
}

// 从落雪音源获取播放地址
async function getLxUrl(params:MusicUrlParams){
  return getLxMusicUrl({
    source:'wy',
    musicInfo: {
      id:params.id,
      songmid:params.id,
      name:params.name,
      singer:params.artist
    },
    quality:'320k'
  })
}

// 获得最终播放地址  网易云优先   无/试听 => 落雪音源
export async function getPlayableUrl(params:MusicUrlParams):Promise<MusicUrlResult>{
  const neteaseUrlmItem = await getNeteaseUrl(Number(params.id))

  if(neteaseUrlmItem?.url && !isPreviewUrl(neteaseUrlmItem)) {
    return {
      id:params.id,
      url:neteaseUrlmItem.url,
      source:'netease',
      isPreview:false
    }
  }

  const lxUrl = await getLxUrl(params)
  return {
    id:params.id,
    url:lxUrl,
    source:'lx',
    isPreview:false
  }
}
