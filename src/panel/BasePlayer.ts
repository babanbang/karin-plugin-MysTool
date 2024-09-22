import { GameList } from "@/types";
import { BasePanel } from "./BasePanel";
import { Data, GamePathType, karinPath } from "@/utils";

export class BasePlayer<g extends GameList> extends BasePanel<g> {
	/** 查询UID */
	uid: string
	/** 昵称 */
	name: string = ''
	/** 等级 */
	level: number = 0
	/** 头像 */
	face: string = ''
	/** 背景图 */
	background: string = ''
	/** 基础信息卡片 */
	recordCard: string = ''
	_updateAvatar: string[] = []

	static BasicKeys = ['name', 'level', 'face', 'card', 'background', 'recordCard']
	constructor(uid: string, game: g) {
		super(game)
		this.uid = uid
	}

	get Face() {
		return this.face || Data.getFilePath(`resources/images/default_face/${this.game}.webp`, GamePathType.Core, karinPath.node)
	}

	get Background() {
		return this.background || Data.getFilePath(`resources/images/default_background/${this.game}.webp`, GamePathType.Core, karinPath.node)
	}

	get PlayerDataPath() {
		return `PlayerData/${this.uid}.json`
	}

	static create<g extends GameList>(uid: string, game: g) {
		const player = new BasePlayer(uid, game)
		const cache = player._getCache<BasePlayer<g>>(`player:${game}:${uid}`)
		if (cache) return cache

		player.reload()
		return player._cache<BasePlayer<g>>(0)
	}

	/** 加载面板数据文件 */
	reload() {
		const data = Data.readJSON(this.PlayerDataPath, GamePathType[this.game], karinPath.data, {})
		this.setBasicData(data)
	}

	/** 保存面板数据 */
	save(saveData: any) {
		Data.writeJSON(this.PlayerDataPath, saveData, GamePathType[this.game], karinPath.data)
		this._delCache()
	}

	/** 设置基础数据 */
	setBasicData(ds: {
		name?: string
		level?: number
		face?: string
		background?: string
		recordCard?: string
	}, save = false) {
		this.name = ds.name || this.name
		this.level = ds.level || this.level
		this.face = ds.face || this.face
		this.background = ds.background || this.background
		this.recordCard = ds.recordCard || this.recordCard

		save && this.save(this.getData(BasePlayer.BasicKeys))
	}
}