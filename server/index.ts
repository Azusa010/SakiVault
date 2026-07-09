import cors from "cors";
import express from "express";
import { animeRouter } from "./anime/routes";
import { musicRouter } from "./music/routes";


const app = express()
const PORT = 3100

// 允许Dev服务器跨域请求
app.use(cors({
  origin: "http://localhost:5173",
}))


// 允许Express服务器解析JSON请求体
app.use(express.json())



app.get("/health",(_req,res)=>{
  res.json({
    ok:true,
    message:"SakiVault Server"
  })
})

// 使用子路由
app.use("/anime", animeRouter)
app.use("/music", musicRouter)


app.listen(PORT,()=>{
  console.log(`SakiVault server running at http://localhost:${PORT}`);

})
