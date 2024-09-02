import { BingUIDType, ConfigName, ConfigsType, GameList, mysUserInfo } from "@/types";
import { Cfg, GamePathType } from "@/utils";
import { KarinMessage, segment } from "node-karin";
import { MysUtil } from "./MysUtil";
import { MysReq } from "karin-plugin-mystool";
import { MysUser, User } from "@/user";

export class MysInfo<g extends GameList> {
	e?: KarinMessage
	game: g
	uid?: string

	ckInfo?: mysUserInfo<g>
	mysUser?: MysUser
	#mysReq!: MysReq<g>

	noTips: boolean = false
	config: ConfigsType<ConfigName.config, GamePathType.Core>

	constructor(game: g, e?: KarinMessage) {
		this.e = e
		this.game = game

		this.config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
	}

	get hoyolab() {
		return this.#mysReq.hoyolab
	}

	get game_biz() {
		return MysUtil.getGamebiz(this.game, this.hoyolab)
	}

	static async init(game: GameList, type: BingUIDType, e?: KarinMessage) {
		const mysInfo = new MysInfo(game, e)

		if (type === BingUIDType.sk || mysInfo.config.onlySelfCk) {
			/** 获取绑定uid */
			mysInfo.uid = await mysInfo.getSelfUid(type)
		} else {
			/** 获取uid */
			mysInfo.uid = await mysInfo.getUid()
		}
	}

	/** 获取ck绑定的uid */
	async getSelfUid(type: BingUIDType) {
		const at = (this.e!.at || [])[0]

		const user = await User.create(at || this.e!.user_id, this.game)
		const atUser = (msg: string) => [segment.at(user.user_id), msg]
		if (!user.uid) {
			if (this.noTips !== true) {
				this.e!.reply(atUser('尚未绑定UID'))
			}
			return undefined
		}
		if (type === BingUIDType.ck && !user.hasCk()) {
			if (this.noTips !== true) {
				this.e!.reply(atUser('尚未绑定Cookie'))
			}
			return user.uid
		}
		if (type === BingUIDType.sk && !user.hasSk()) {
			if (this.noTips !== true) {
				this.e!.reply(atUser('尚未绑定Stoken'))
			}
			return user.uid
		}

		this.mysUser = user.getMysUserByUid()
		this.ckInfo = { ...this.mysUser.getMysUserInfo(), owner: true }
		return user.uid
	}

	/** 获取UID */
	async getUid() {
		let uid = MysUtil.matchUid(this.e!.msg, this.game)
		if (!uid) {
			this.noTips = true
			uid = await this.getSelfUid(BingUIDType.ck)
			this.noTips = false
			if (!uid) return undefined

			if (this.ckInfo?.cookie && this.mysUser) {
				return uid
			}
		}

		await this.getCookie(uid)
		return uid
	}

	async getCookie(uid: string) {
		const mysUser = await MysUser.getByQueryUid(uid, this.game)
		if (mysUser) {
			this.mysUser = mysUser
			this.ckInfo = { ...mysUser.getMysUserInfo(), owner: false }
		}
		return undefined
	}
}