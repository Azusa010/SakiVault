import {Router} from "express";

export const animeRouter = Router()


// 动漫健康状态
animeRouter.get("/health",(_req,res)=>{
  res.json({
    ok:true,
    module:"anime"
  })
})
