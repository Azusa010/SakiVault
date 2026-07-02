import axios from 'axios'

const bangumiClient = axios.create({
  baseURL: 'https://api.bgm.tv/v0',
  headers: {
    'Accept': 'application/json',
    'User-Agent' : 'SakiVault/1.0'
  },
})
