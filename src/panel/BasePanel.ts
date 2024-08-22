import { GameList } from "@/types";
import { Data, GamePathType, PluginName } from "@/utils";

const reFn: Partial<Record<string, any>> = {}
const metaMap: Partial<Record<string, any>> = {}
const cacheMap: Partial<Record<string, any>> = {}
export class BasePanel {
    game: GameList
    _uuid!: string
    _get?: (key: string) => any
    meta: Record<string, any> = {}
    _dataKey?: string[]

    constructor(game: GameList) {
        this.game = game
        return new Proxy(this, {
            get(self, key, receiver) {
                if (self._uuid && key === 'meta') {
                    return metaMap[self._uuid]
                }
                if (key in self || typeof key === 'symbol') {
                    return Reflect.get(self, key, receiver)
                }
                if (self._get) {
                    return self._get.call(receiver, key)
                }
                if (self._uuid) {
                    return (metaMap[self._uuid] || {})[key]
                } else {
                    return self.meta[key]
                }
            },
            set(target, key, newValue) {
                if (target._uuid && key === 'meta') {
                    metaMap[target._uuid] = newValue
                    return true
                } else {
                    return Reflect.set(target, key, newValue)
                }
            }
        })
    }

    getData<T extends string>(arrList: T[]) {
        return Data.getData<T>(this, arrList)
    }

    /** 获取缓存 */
    _getCache(uuid = '', time = 10 * 60) {
        if (uuid && cacheMap[uuid]) {
            return cacheMap[uuid]._expire(time)
        }
        this._uuid = uuid
    }

    /** 设置缓存 */
    _cache(time = 10 * 60) {
        if (this._uuid) {
            this._expire(time)
            cacheMap[this._uuid] = this
            return cacheMap[this._uuid]
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