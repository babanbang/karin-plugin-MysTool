import { logger } from "node-karin"
import { fs } from "node-karin/modules.js"
import { PluginName, dirPath, getDir } from "./dir"

interface Options {
  /** 使用MysTool的指定目录 */
  m_path?: string
  /** 使用Karin的data目录 */
  k_data?: boolean
  /** 使用Karin的temp目录 */
  k_temp?: boolean
  /** 读取数据失败时的默认值 */
  defData?: {} | []
}
export type GamePathType = 'gs' | 'sr' | 'zzz' | 'sign' | ''

const KarinPath = process.cwd().replace(/\\/g, '/')

export const Data = new (class Data {
  #GamePath: { [key in GamePathType]?: string } = { gs: 'Genshin/', sr: 'StarRail/', zzz: 'ZZZero/', sign: 'MysSign/' }
  constructor() {

  }

  getFilePath(file: string, options: Options = {}) {
    if (options.k_temp) return KarinPath + `/temp/${PluginName}/` + file.replace(/^\//g, '')
    if (options.k_data) return KarinPath + `/data/${PluginName}/` + file.replace(/^\//g, '')
    if (options.m_path) return getDir(options.m_path).path + '/' + file.replace(/^\//g, '')
    return dirPath + '/' + file.replace(/^\//g, '')
  }
  /** 
   * 根据指定的path依次检查与创建目录
   */
  createDir(path: string, options: Options = {}) {
    let file = '/'
    const dirpath = options.k_temp ? (KarinPath + `/temp/${PluginName}`)
      : options.k_data ? (KarinPath + `/data/${PluginName}`) : dirPath

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

  addGamePath(file: string, game: GamePathType) {
    this.#GamePath[game] = file
  }

  getGamePath(game: GamePathType) {
    return this.#GamePath[game] || ''
  }
})