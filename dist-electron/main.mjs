import { BrowserWindow as e, app as t, ipcMain as n, net as r, session as i } from "electron";
import a from "node:path";
import { fileURLToPath as o } from "node:url";
import { readFile as s } from "node:fs/promises";
//#region src/utils/sourceRule.ts
var c = [
	"api",
	"name",
	"version",
	"baseURL",
	"searchURL",
	"searchList",
	"searchName",
	"searchResult",
	"chapterRoads",
	"chapterResult"
];
function l(e) {
	return u(e) ? d(e.name) && d(e.version) : !1;
}
function u(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function d(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function f(e) {
	return !u(e) || e.type !== "anime" ? !1 : c.every((t) => d(e[t]));
}
function p(e, t) {
	let n = encodeURIComponent(t.trim());
	return e.searchURL.split("@keyword").join(n);
}
//#endregion
//#region electron/main.ts
var m = a.dirname(o(import.meta.url)), h = !t.isPackaged, g = h ? a.join(m, "KazumiRules") : a.join(process.resourcesPath, "KazumiRules"), _ = a.join(m, "preload.cjs"), v = a.join(m, "../dist/index.html"), y = /^\/(?:trending\/subjects|subjects\/\d+\/(?:comments|reviews|staffs\/persons))$/;
function b(e) {
	return typeof e != "object" || !e || Array.isArray(e) ? !1 : Object.values(e).every((e) => typeof e == "string" || typeof e == "number");
}
async function x(e, t) {
	if (typeof e != "string" || !y.test(e)) throw Error("Bangumi Next API路径无效");
	if (t !== void 0 && !b(t)) throw Error("Bangumi Next 查询参数无效");
	let n = new URL(`https://next.bgm.tv/p1${e}`);
	if (t !== void 0) for (let [e, r] of Object.entries(t)) n.searchParams.set(e, String(r));
	let i = await r.fetch(n.toString(), { headers: { Accept: "application/json" } });
	if (!i.ok) throw Error(`Bangumi Next 请求失败：${i.status}`);
	return i.json();
}
function S() {
	n.handle("bangumi:next-get", async (e, t, n) => x(t, n));
}
async function C(e, t) {
	try {
		let t = await s(a.join(g, e), "utf8");
		return JSON.parse(t);
	} catch {
		throw Error(t);
	}
}
var w = /* @__PURE__ */ new Map();
async function T() {
	let e = await C("index.json", "规则库索引加载失败");
	if (!Array.isArray(e)) throw Error("规则库索引格式无效");
	return e.filter(l);
}
async function E(e) {
	if (typeof e != "string" || !/^[a-zA-Z0-9_-]+$/.test(e)) throw Error("规则名称无效");
	let t = await C(`${e}.json`, `本地规则 ${e} 读取失败`);
	if (!f(t)) throw Error(`规则 ${e} 格式不兼容`);
	return t;
}
function D(e) {
	try {
		let t = new URL(e);
		return t.protocol === "https:" || t.protocol === "http:";
	} catch {
		return !1;
	}
}
function O(e) {
	return `
    (() => {
      const rule = ${JSON.stringify(e)}

      const evaluateXPath = (context, xpath) => {
        const normalizedXPath = xpath.startsWith('//') ? '.' + xpath : xpath
        const result = document.evaluate(
          normalizedXPath,
          context,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        )

        const nodes = []
        for (let index = 0; index < result.snapshotLength; index += 1) {
          const node = result.snapshotItem(index)
          if (node) nodes.push(node)
        }
        return nodes
      }

      return evaluateXPath(document, rule.searchList).flatMap((card) => {
        const nameNode = evaluateXPath(card, rule.searchName)[0]
        const resultNode = evaluateXPath(card, rule.searchResult)[0]
        const name = nameNode?.textContent?.trim() || ''
        const href = resultNode?.getAttribute?.('href') || ''

        if (!name || !href) return []

        try {
          return [{
            name,
            url: new URL(href, rule.baseURL).toString(),
          }]
        } catch {
          return []
        }
      })
    })()
  `;
}
function k(e) {
	return `
    (() => {
      const rule = ${JSON.stringify(e)}

      const evaluateXPath = (context, xpath) => {
        const normalizedXPath = xpath.startsWith('//') ? '.' + xpath : xpath
        const result = document.evaluate(
          normalizedXPath,
          context,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        )

        const nodes = []
        for (let index = 0; index < result.snapshotLength; index += 1) {
          const node = result.snapshotItem(index)
          if (node) nodes.push(node)
        }
        return nodes
      }

      return evaluateXPath(document, rule.chapterRoads)
        .map((routeNode, routeIndex) => {
          const episodes = evaluateXPath(routeNode, rule.chapterResult)
            .map((episodeNode, episodeIndex) => {
              const href = episodeNode?.getAttribute?.('href') || ''

              if (!href) return null

              try {
                return {
                  title: episodeNode.textContent?.trim() || '第 ' + (episodeIndex + 1) + ' 集',
                  url: new URL(href, location.href).toString(),
                }
              } catch {
                return null
              }
            })
            .filter(Boolean)

          return {
            name: '线路 ' + (routeIndex + 1),
            episodes,
          }
        })
        .filter((route) => route.episodes.length > 0)
    })()
  `;
}
async function A(t, n) {
	if (!f(t)) throw Error("来源规则格式无效");
	if (typeof n != "string" || !D(n)) throw Error("播放页面地址无效");
	let r = new e({
		show: !1,
		webPreferences: {
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !0
		}
	});
	r.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	try {
		await P(r, n);
		let e = await r.webContents.executeJavaScript(k(t));
		return Array.isArray(e) ? e : [];
	} finally {
		r.isDestroyed() || r.destroy();
	}
}
function j(e) {
	try {
		let t = new URL(e).pathname.toLowerCase();
		return t.endsWith(".m3u8") || t.endsWith(".mp4") || t.endsWith(".webm");
	} catch {
		return !1;
	}
}
function M(e) {
	let t = e.webContents.session.webRequest, n, r = !1, i, a, o = new Promise((e, t) => {
		i = e, a = t;
	}), s = () => {
		n && clearTimeout(n), t.onBeforeRequest(null);
	};
	return t.onBeforeRequest({ urls: ["*://*/*"] }, (t, n) => {
		n({}), !(r || t.webContentsId !== e.webContents.id || !j(t.url)) && (r = !0, s(), i({
			url: t.url,
			referer: t.referrer || e.webContents.getURL()
		}));
	}), n = setTimeout(() => {
		r || (r = !0, s(), a(/* @__PURE__ */ Error("未能在播放页面中找到视频地址")));
	}, 2e4), {
		promise: o,
		dispose: s
	};
}
async function N(t) {
	if (typeof t != "string" || !D(t)) throw Error("单集播放地址无效");
	let n = new e({
		show: !1,
		webPreferences: {
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !0,
			partition: "watch-sniff"
		}
	});
	n.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	let r = M(n);
	try {
		return await P(n, t), await n.webContents.executeJavaScript("\n      document.querySelectorAll('video').forEach((video) => {\n        video.muted = true\n        video.play().catch(() => {})\n      })\n    "), await r.promise;
	} finally {
		r.dispose(), n.isDestroyed() || n.destroy();
	}
}
async function P(e, t) {
	let n;
	try {
		await Promise.race([e.loadURL(t), new Promise((e, t) => {
			n = setTimeout(() => {
				t(/* @__PURE__ */ Error("来源搜索超时，请稍后重试"));
			}, 15e3);
		})]);
	} finally {
		n && clearTimeout(n);
	}
}
async function F(t, n) {
	if (!f(t)) throw Error("来源规则格式无效");
	if (typeof n != "string" || !n.trim()) throw Error("搜索关键词不能为空");
	let r = p(t, n);
	if (!D(r)) throw Error("规则中的搜索地址不是合法网页地址");
	let i = new e({
		show: !1,
		webPreferences: {
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !0
		}
	});
	i.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	try {
		await P(i, r);
		let e = await i.webContents.executeJavaScript(O(t));
		return Array.isArray(e) ? e : [];
	} finally {
		i.isDestroyed() || i.destroy();
	}
}
function I(e, t) {
	return `${e.name}:${t.trim().toLowerCase()}`;
}
async function L(e, t) {
	if (!f(e)) throw Error("来源规则格式无效");
	if (typeof t != "string" || !t.trim()) throw Error("搜索关键词不能为空");
	let n = I(e, t), r = w.get(n);
	if (r) return r;
	let i = await F(e, t);
	return w.set(n, i), i;
}
async function R(e, t) {
	if (typeof e != "string" || !e.trim()) throw Error("搜索关键词不能为空");
	let n = await T(), r = [], i = 0;
	async function a() {
		for (; i < n.length;) {
			let a = n[i];
			i++;
			try {
				let n = await L(await E(a.name), e), i = {
					...a,
					status: n.length > 0 ? "available" : "unavailable",
					resultCount: n.length
				};
				r.push(i), t(i);
			} catch {
				let e = {
					...a,
					status: "unavailable",
					resultCount: 0
				};
				r.push(e), t(e);
			}
		}
	}
	let o = Math.min(6, n.length);
	return await Promise.all(Array.from({ length: o }, () => a())), r;
}
function z() {
	n.on("window:minimize", (t) => {
		e.fromWebContents(t.sender)?.minimize();
	}), n.on("window:toggle-maximize", (t) => {
		let n = e.fromWebContents(t.sender);
		if (n) {
			if (n.isMaximized()) {
				n.unmaximize();
				return;
			}
			n.maximize();
		}
	}), n.on("window:close", (t) => {
		e.fromWebContents(t.sender)?.close();
	});
}
function B() {
	n.handle("watch:list-rules", async () => T()), n.handle("watch:load-rule", async (e, t) => E(t)), n.handle("watch:load-episodes", async (e, t, n) => A(t, n)), n.handle("watch:search", async (e, t, n) => L(t, n)), n.handle("watch:resolve-stream", async (e, t) => N(t)), n.handle("watch:check-sources", async (e, t) => R(t, (t) => {
		e.sender.isDestroyed() || e.sender.send("watch:source-checked", t);
	}));
}
t.on("ready", async () => {
	await i.defaultSession.setProxy({ mode: "system" }), B(), S(), z();
	let t = new e({
		frame: !1,
		backgroundColor: "#0b0e14",
		width: 1200,
		height: 800,
		minWidth: 960,
		minHeight: 640,
		autoHideMenuBar: !0,
		webPreferences: {
			contextIsolation: !0,
			nodeIntegration: !1,
			preload: _
		}
	});
	h ? (t.loadURL("http://localhost:5173"), t.webContents.openDevTools()) : t.loadFile(v);
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion

//# sourceMappingURL=main.mjs.map