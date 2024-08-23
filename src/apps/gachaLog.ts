import { MysReq, MysUtil, getGachaLog } from '@/mys'
import { GameList, GsRegin, SrRegin, ZzzRegin } from '@/types'
import lodash from 'node-karin/lodash'
import { KarinMessage, common, handler, karin } from 'node-karin'

async function checkUrl(e: KarinMessage, res: { retcode: number }) {
	if (res?.retcode == -101) {
		return "该链接已失效，请重新获取链接"
	} else if (res?.retcode == 400) {
		return "获取数据错误"
	} else if (res?.retcode == -100) {
		if (e.msg.length == 1000) {
			return "输入法限制，链接复制不完整，请更换输入法复制完整链接"
		}
		return "链接不完整，请长按全选复制全部内容（可能输入法复制限制），或者复制的不是历史记录页面链接"
	} else if (res?.retcode != 0) {
		return "链接复制错误"
	} else {
		return false
	}
}

export const checkGachaUrl = karin.handler(
	'mys.checkGachaUrl',
	({ e, res }) => checkUrl(e, res),
	{ name: '检查抽卡链接', priority: 0 }
)

export const dealGachaUrl = karin.command(
	"(.*)authkey=(.*)",
	async (e) => {
		let game = /(operation-nap|\/nap\/)/.test(e.msg) ? GameList.Zzz
			: /\/(common|hkrpg)\//.test(e.msg) ? GameList.Sr
				: GameList.Gs

		let url = e.msg.replace(/〈=/g, "&")
		if (url.includes("getGachaLog?")) {
			url = url.split("getGachaLog?")[1]
		} else if (url.includes("index.html?")) {
			url = url.split("index.html?")[1]
		}

		const params: any = {}
		const arr = new URLSearchParams(url).entries()
		for (let val of arr) {
			params[val[0]] = val[1]
		}

		if (!params.authkey) {
			e.reply("抽卡链接复制错误，缺少authkey")
			return true
		}

		// 去除#/,#/log
		params.authkey = encodeURIComponent(params.authkey.replace(/#\/|#\/log/g, ""))

		const data = (game: GameList) => ({
			gacha_type: game === GameList.Sr ? 11 : game === GameList.Gs ? 301 : 1001,
			authkey: params.authkey,
			page: 1,
			end_id: 0
		})
		const mys = (game: GameList, os = false) => {
			if (!os && params.region) {
				return { region: params.region }
			}
			else if (game === GameList.Gs) {
				return { region: os ? GsRegin.asia : GsRegin.gf }
			}
			else if (game === GameList.Sr) {
				return { region: os ? SrRegin.asia : SrRegin.gf }
			} else {
				return { region: os ? ZzzRegin.asia : ZzzRegin.gf }
			}
		}

		let res = await getGachaLog(new MysReq(e.user_id, game, mys(game), { log: false }), data(game))
		if (res?.retcode == -111) {
			const games = lodash(MysUtil.games).map('key').pull(game).value()

			for (const g of games) {
				await common.sleep(200)
				res = await getGachaLog(new MysReq(e.user_id, game, mys(g), { log: false }), data(g))
				if (res?.retcode == -111) continue
				game = g
				break
			}
		}
		if (!res?.data?.region) {
			res = await getGachaLog(new MysReq(e.user_id, game, mys(game, true), { log: false }), data(game))
		}

		if (res?.data?.region) {
			params.region = res?.data?.region
		} else {
			e.reply("抽卡链接复制错误或已失效", { at: true })
			return true
		}

		const check = await checkUrl(e, res)
		if (check) return e.reply(check)

		const key = `mys.${game}.gachaLog`
		if (handler.has(key)) {
			e.reply("链接发送成功，数据获取中……")
			return await handler.call(key, { e, params })
		}
		return false
	},
	{ name: '抽卡链接更新抽卡记录', priority: 0 }
)
