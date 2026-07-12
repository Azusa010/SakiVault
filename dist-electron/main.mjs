import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r from "node:path";
import { fileURLToPath as i } from "node:url";
import { readFile as a } from "node:fs/promises";
//#region src/utils/sourceRule.ts
var o = [
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
function s(e) {
	return c(e) ? l(e.name) && l(e.version) : !1;
}
function c(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function l(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function u(e) {
	return !c(e) || e.type !== "anime" ? !1 : o.every((t) => l(e[t]));
}
function d(e, t) {
	let n = encodeURIComponent(t.trim());
	return e.searchURL.split("@keyword").join(n);
}
//#endregion
//#region electron/main.ts
var f = r.dirname(i(import.meta.url)), p = !t.isPackaged, m = p ? r.join(f, "KazumiRules") : r.join(process.resourcesPath, "KazumiRules"), h = r.join(f, "preload.cjs"), g = r.join(f, "../dist/index.html");
async function _(e, t) {
	try {
		let t = await a(r.join(m, e), "utf8");
		return JSON.parse(t);
	} catch {
		throw Error(t);
	}
}
var v = /* @__PURE__ */ new Map();
async function y() {
	let e = await _("index.json", "规则库索引加载失败");
	if (!Array.isArray(e)) throw Error("规则库索引格式无效");
	return e.filter(s);
}
async function b(e) {
	if (typeof e != "string" || !/^[a-zA-Z0-9_-]+$/.test(e)) throw Error("规则名称无效");
	let t = await _(`${e}.json`, `本地规则 ${e} 读取失败`);
	if (!u(t)) throw Error(`规则 ${e} 格式不兼容`);
	return t;
}
function x(e) {
	try {
		let t = new URL(e);
		return t.protocol === "https:" || t.protocol === "http:";
	} catch {
		return !1;
	}
}
function S(e) {
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
function C(e) {
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
async function w(t, n) {
	if (!u(t)) throw Error("来源规则格式无效");
	if (typeof n != "string" || !x(n)) throw Error("播放页面地址无效");
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
		await O(r, n);
		let e = await r.webContents.executeJavaScript(C(t));
		return Array.isArray(e) ? e : [];
	} finally {
		r.isDestroyed() || r.destroy();
	}
}
function T(e) {
	try {
		let t = new URL(e).pathname.toLowerCase();
		return t.endsWith(".m3u8") || t.endsWith(".mp4") || t.endsWith(".webm");
	} catch {
		return !1;
	}
}
function E(e) {
	let t = e.webContents.session.webRequest, n, r = !1, i, a, o = new Promise((e, t) => {
		i = e, a = t;
	}), s = () => {
		n && clearTimeout(n), t.onBeforeRequest(null);
	};
	return t.onBeforeRequest({ urls: ["*://*/*"] }, (t, n) => {
		n({}), !(r || t.webContentsId !== e.webContents.id || !T(t.url)) && (r = !0, s(), i({
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
async function D(t) {
	if (typeof t != "string" || !x(t)) throw Error("单集播放地址无效");
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
	let r = E(n);
	try {
		return await O(n, t), await n.webContents.executeJavaScript("\n      document.querySelectorAll('video').forEach((video) => {\n        video.muted = true\n        video.play().catch(() => {})\n      })\n    "), await r.promise;
	} finally {
		r.dispose(), n.isDestroyed() || n.destroy();
	}
}
async function O(e, t) {
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
async function k(t, n) {
	if (!u(t)) throw Error("来源规则格式无效");
	if (typeof n != "string" || !n.trim()) throw Error("搜索关键词不能为空");
	let r = d(t, n);
	if (!x(r)) throw Error("规则中的搜索地址不是合法网页地址");
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
		await O(i, r);
		let e = await i.webContents.executeJavaScript(S(t));
		return Array.isArray(e) ? e : [];
	} finally {
		i.isDestroyed() || i.destroy();
	}
}
function A(e, t) {
	return `${e.name}:${t.trim().toLowerCase()}`;
}
async function j(e, t) {
	if (!u(e)) throw Error("来源规则格式无效");
	if (typeof t != "string" || !t.trim()) throw Error("搜索关键词不能为空");
	let n = A(e, t), r = v.get(n);
	if (r) return r;
	let i = await k(e, t);
	return v.set(n, i), i;
}
async function M(e, t) {
	if (typeof e != "string" || !e.trim()) throw Error("搜索关键词不能为空");
	let n = await y(), r = [], i = 0;
	async function a() {
		for (; i < n.length;) {
			let a = n[i];
			i++;
			try {
				let n = await j(await b(a.name), e), i = {
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
function N() {
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
function P() {
	n.handle("watch:list-rules", async () => y()), n.handle("watch:load-rule", async (e, t) => b(t)), n.handle("watch:load-episodes", async (e, t, n) => w(t, n)), n.handle("watch:search", async (e, t, n) => j(t, n)), n.handle("watch:resolve-stream", async (e, t) => D(t)), n.handle("watch:check-sources", async (e, t) => M(t, (t) => {
		e.sender.isDestroyed() || e.sender.send("watch:source-checked", t);
	}));
}
t.on("ready", () => {
	P(), N();
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
			preload: h
		}
	});
	p ? (t.loadURL("http://localhost:5173"), t.webContents.openDevTools()) : t.loadFile(g);
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion

//# sourceMappingURL=main.mjs.map