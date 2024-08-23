import { MysReq, MysUtil, miyolive_actId, miyolive_code, miyolive_index } from '@/mys'
import { GameList, MysType } from '@/types'
import { PluginName } from '@/utils'
import { Plugin, common, logger, redis } from 'node-karin'

const game_uid = { [GameList.Gs]: '75276550', [GameList.Sr]: '80823548', [GameList.Zzz]: '152039148' }

const reg = Object.values(MysUtil.reg).join('?|')
export class exchange extends Plugin {
	redisKey!: string
	mysReq!: MysReq<GameList>
	constructor() {
		super({
			name: '前瞻直播兑换码',
			event: 'message',
			priority: 0,
			rule: [
				{
					reg: new RegExp(`^(${reg})(直播|前瞻)?兑换码$`, 'i'),
					fnc: 'getCode'
				}
			]
		})
	}

	async getCode() {
		const game = MysUtil.getGameByMsg(this.e.msg)
		if (!game) return false

		let msg = []
		this.redisKey = `${PluginName}:${game.key}:Exchange:`
		this.mysReq = new MysReq(game_uid[game.key], game.key, { type: MysType.cn }, { log: false })

		const catchData = await redis.get(this.redisKey + 'codes')
		if (catchData) {
			msg = JSON.parse(catchData)
		} else {
			const { actid = '', deadline = '', timeout = false, EXTime = { EX: 0 } } = await this.getActId()
			if (timeout) {
				this.reply(`当前暂无${game.name}直播兑换码`)
				return true
			}
			if (!actid) {
				logger.info(game.name + '[兑换码] 未获取到actId')
				return true
			}

			const index = await miyolive_index(this.mysReq, { actid })
			if (!index?.data?.live?.title) return true

			const index_data = index.data.live
			const { title, code_ver, remain } = index_data
			if (remain > 0) {
				this.reply(`暂无${title || game.name}-直播兑换码`)
				return true
			}

			const code = await miyolive_code(this.mysReq, { actid, code_ver })
			if (!code?.data?.code_list) {
				logger.info(game.name + '[兑换码] 未获取到兑换码')
				this.reply(`当前暂无${title || game.name}-直播兑换码`)
				return true
			}

			if (!EXTime.EX && code.data.code_list[0].to_get_time) {
				const date = new Date(code.data.code_list[0].to_get_time * 1000)
				date.setDate(date.getDate() + 1)
				if (date.setHours(23, 59, 59) < Date.now()) {
					this.reply(`当前暂无${title || game.name}-直播兑换码`)
					return true
				}
				EXTime.EX = Math.floor((date.setHours(23, 59, 59) - Date.now()) / 1000)

				redis.set(this.redisKey + 'actid', JSON.stringify({
					actid, EXTime,
					deadline: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 12:00:00 或 23:59:59`
				}), EXTime)
			}

			if (!code?.data?.code_list?.length || !code?.data?.code_list?.[0]?.code) {
				this.reply(`当前暂无${title || game.name}-直播兑换码`)
				return true
			}

			const codes = code.data.code_list.map(val => val.code).filter(code => code)
			msg = [`${title || game.name}-直播兑换码`, `兑换码过期时间: \n${deadline}\n具体时间以前瞻直播为准！`, ...codes]
			if (codes.length === 3) {
				redis.set(this.redisKey + 'codes', JSON.stringify(msg), EXTime)
			}
		}

		this.replyForward(common.makeForward(msg, this.e.self_id, this.e.bot.account.name))
		return true
	}

	/** 获取act_id */
	async getActId() {
		const catchData = await redis.get(this.redisKey + 'actid')
		if (catchData) {
			return JSON.parse(catchData)
		}

		const ret = await miyolive_actId(this.mysReq)
		if (ret?.retcode !== 0) { return {} }

		for (const p of ret.data.list) {
			const post = p?.post?.post
			if (!post) continue

			const structured_content = post.structured_content
			const result = structured_content.match(/{\"link\":\"https:\/\/webstatic.mihoyo.com\/bbs\/event\/live\/index.html\?act_id=(.*?)\\/)
			if (result?.[1]) {
				return { actid: result[1] }
			}
		}

		return { timeout: true }
	}
}
