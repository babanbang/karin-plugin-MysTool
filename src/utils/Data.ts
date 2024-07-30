import { logger } from "node-karin"
import { fs, lodash } from "node-karin/modules"
import { PluginName, dirPath, getDir } from "./dir"

export const enum karinPath {
  config = 'config/plugin',
  plugins = 'plugins',
  data = 'data',
  temp = 'temp'
}
7
interface Options {
  /** 使用MysTool的指定目录 */
  m_path?: string
  /** 使用Karin的指定目录 */
  k?: karinPath
  /** 读取数据失败时的默认值 */
  defData?: {} | []
  /** 读取模块时的指定模块名 */
  module?: string
}

export enum GamePathType {
  gs = 'gs', sr = 'sr', zzz = 'zzz', Sign = 'sign', Core = 'core'
}

const KarinPath = getDir(import.meta.url, 4).path

export const Data = new (class Data {
  #GamePath: Partial<Record<GamePathType, string>> = {
    [GamePathType.gs]: 'Genshin/',
    [GamePathType.sr]: 'StarRail/',
    [GamePathType.zzz]: 'ZZZero/',
    [GamePathType.Sign]: 'MysSign/',
    [GamePathType.Core]: '/'
  }
  /** 
   * 获取文件路径，返回的路径不以/结尾
   */
  getFilePath(file: string, options: Options = {}) {
    if (new RegExp(KarinPath).test(file)) return file

    file = file.replace(/(^\/|\/$)/g, '')
    if (file) file += '/'

    if (options.k) return KarinPath + `/${options.k}/${PluginName}` + file
    if (options.m_path) return getDir(options.m_path).path + file
    return dirPath + file
  }
  /** 
   * 根据指定的path依次检查与创建目录
   */
  createDir(path: string, options: Options = {}) {
    let file = '/'
    const dirpath = options.k ? (KarinPath + `/${options.k}/${PluginName}`) : dirPath

    if (/\.(yaml|json|js|html|db)$/.test(path)) {
      const idx = path.lastIndexOf('/') + 1
      file += path.substring(idx)
      path = path.substring(0, idx)
    }

    path = path.replace(/^\/+|\/+$/g, '')
    if (fs.existsSync(dirpath + '/' + path)) {
      return dirpath + '/' + path + file
    }

    let nowPath = dirpath + '/'
    path.split('/').forEach(name => {
      nowPath += name + '/'
      if (!fs.existsSync(nowPath)) {
        fs.mkdirSync(nowPath)
      }
    })

    return nowPath + file
  }

  copyFile(copy: string, target: string, options: Options = {}) {
    const copyFile = this.getFilePath(copy, options)
    const targetFile = this.createDir(target, options)
    fs.copyFileSync(copyFile, targetFile)
  }

  readJSON(file: string, options: Options = {}) {
    const path = this.getFilePath(file, options)
    if (fs.existsSync(path)) {
      try {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (e) {
        logger.error(`JSON数据错误: ${path}`)
        logger.error(e)
      }
    }
    return options.defData
  }

  writeJSON(file: string, data: any, options: Options = {}) {
    const path = this.createDir(file, options)
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
    return path
  }

  addGamePath(file: string, game: GamePathType) {
    this.#GamePath[game] = file
  }

  /** 获取组件目录，返回的路径以/结尾 */
  getGamePath(game: GamePathType, noPluginName = false) {
    if (noPluginName) return this.#GamePath[game]!
    return PluginName + this.#GamePath[game]
  }

  async importModule(file: string, options: Options = {}) {
    const path = this.getFilePath(file, options)
    if (fs.existsSync(path)) {
      try {
        const module = await import(`file://${path}?t=${Date.now()}`) || {}
        return { module: module?.[options.module || 'default'], path }
      } catch (e) {
        logger.error(e)
      }
    }
    logger.error(`不存在: ${path}`)
    return { module: options.defData, path }
  }

  getData<T extends string>(target: any, keysArr: T[]) {
    const ret: Partial<Record<T, any>> = {}

    lodash.forEach(keysArr, (key) => {
      const _key = key.split(':').map(k => k.trim())
      const key1 = _key[0] as T
      ret[key1] = lodash.get(target, _key[1] || key1)
    })
    return ret
  }
})