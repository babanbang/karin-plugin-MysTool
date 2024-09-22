import { GameList } from "@/types";
import { Data } from "@/utils";

const reFn: Partial<Record<string, any>> = {}
const metaMap: Partial<Record<string, any>> = {}
const cacheMap: Partial<Record<string, any>> = {}
export class BasePanel<g extends GameList>{
	game: g
	declare _uuid: string

	constructor(game: g) {
		this.game = game
	}

	getData<T extends string>(arrList: T[]) {
		return Data.getData<T>(this, arrList)
	}

	/** 获取缓存 */
	_getCache<T>(uuid = '', time = 10 * 60) {
		if (uuid && cacheMap[uuid]) {
			return cacheMap[uuid]._expire(time) as T
		}
		this._uuid = uuid
	}

	/** 设置缓存 */
	_cache<T>(time = 10 * 60) {
		if (this._uuid && time > 0) {
			this._expire(time)
			cacheMap[this._uuid] = this
			return cacheMap[this._uuid] as T
		}
		return this
	}

	/** 设置超时时间 */
	_expire(time = 10 * 60) {
		const self = this
		const id = this._uuid
		reFn[id] && clearTimeout(reFn[id])
		if (time > 0) {
			if (id) {
				reFn[id] = setTimeout(() => {
					self._delCache()
				}, time * 1000)
			}
			return cacheMap[id]
		}
	}

	_delCache() {
		const id = this._uuid
		reFn[id] && clearTimeout(reFn[id])
		delete reFn[id]
		delete cacheMap[id]
		delete metaMap[id]
	}
}