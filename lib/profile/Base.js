import { Data, PluginName } from '#MysTool/utils'

const reFn = {}
const metaMap = {}
const cacheMap = {}
export default class Base {
  constructor (game = 'gs') {
    this.game = game
    return new Proxy(this, {
      get (self, key, receiver) {
        if (self._uuid && key === 'meta') {
          return metaMap[self._uuid]
        }
        if (key in self) {
          return Reflect.get(self, key, receiver)
        }
        if (self._get) {
          return self._get.call(receiver, key)
        }
        if (self._uuid) {
          return (metaMap[self._uuid] || {})[key]
        } else {
          return (self.meta || {})[key]
        }
      },
      set (target, key, newValue) {
        if (target._uuid && key === 'meta') {
          metaMap[target._uuid] = newValue
          return true
        } else {
          return Reflect.set(target, key, newValue)
        }
      }
    })
  }
  get redisPrefix () {
    return PluginName + ':' + this.game + ':'
  }

  get gamePath () {
    return Data.gamePath(this.game)
  }
  get metaPath () {
    return `components/${this.gamePath}resources/meta/`
  }

  get PlayerDataPath () {
    return `${this.gamePath}PlayerData/${this.uid}.json`
  }

  getData (arrList = '', cfg = {}) {
    arrList = arrList || this._dataKey || this.constructor._dataKey || ''
    return Data.getData(this, arrList, cfg)
  }

  /** 获取缓存 */
  _getCache (uuid = '', time = 10 * 60) {
    if (uuid && cacheMap[uuid]) {
      return cacheMap[uuid]._expire(time)
    }
    this._uuid = uuid
  }

  /** 设置缓存 */
  _cache (time = 10 * 60) {
    const id = this._uuid
    if (id) {
      this._expire(time)
      cacheMap[id] = this
      return cacheMap[id]
    }
    return this
  }

  /** 设置超时时间 */
  _expire (time = 10 * 60) {
    const id = this._uuid
    const self = this
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

  _delCache () {
    const id = this._uuid
    reFn[id] && clearTimeout(reFn[id])
    delete reFn[id]
    delete cacheMap[id]
    delete metaMap[id]
  }

  get isGs () {
    return this.game === 'gs'
  }

  get isSr () {
    return this.game === 'sr'
  }

  get isZzz () {
    return this.game === 'zzz'
  }
}
