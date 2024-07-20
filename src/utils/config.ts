import { logger } from 'node-karin'
import { fs, yaml as Yaml, chokidar } from 'node-karin/modules.js'
import { Data, GamePathType } from './Data'
import { PluginName, dirPath } from './dir'

type ConfigType = 'config' | 'defSet'

export const Cfg = new (class Config {
  #config: Map<string, any> = new Map()
  #watcher: Map<string, any> = new Map()
  #PluginConfigView = []
  constructor() {
    this.initCfg('/config')
  }

  /** 初始化配置 */
  async initCfg(Path: string = '', game: GamePathType = '') {

  }

  get package() {
    return Data.readJSON('package.json')
  }

  /** 用户配置 */
  getConfig(name: string, game: GamePathType = '') {
    return { ...this.#getYaml('config', name, game) }
  }

  /** 默认配置 */
  getdefSet(name: string, game: GamePathType = '', Document = false) {
    const defSet = this.#getYaml('defSet', name, game, Document)
    if (Document) return Yaml.parseDocument(defSet.toString())
    return { ...defSet }
  }

  /** 获取配置yaml */
  #getYaml(type: ConfigType, name: string, game: GamePathType, Document = false) {
    const file = this.getConfigPath(type, game, name)
    if (Document) type += '_Document'
    const key = `${type}.${game}.${name}`

    let cfg = this.#config.get(key)
    if (cfg) return cfg

    try {
      const data = fs.readFileSync(file, 'utf8')
      cfg = Document ? Yaml.parseDocument(data) : { ...Yaml.parse(data), CfgKey: key }
      this.#config.set(key, cfg)
    } catch (error) {
      logger.error(`[${PluginName}][${key}] 格式错误 ${error}`)
      return false
    }

    if (!Document) this.#watch(file, key)
    return cfg
  }

  /** 获取配置路径 */
  getConfigPath(type: ConfigType, game: GamePathType, name: string) {
    if (type === 'config') {
      return `${dirPath}/config/config/${Data.getGamePath(game).replace('/', '-')}${name}.yaml`
    } else if (game) {
      return `${dirPath}/lib/components/${Data.getGamePath(game)}${type}/${name}.yaml`
    } else {
      return `${dirPath}/config/${type}/${name}.yaml`
    }
  }

  /** 监听配置文件 */
  #watch(file: string, key: string) {

    if (this.#watcher.has(key)) return

    const watcher = chokidar.watch(file)
    watcher.on('change', () => {
      if (key.includes('config')) {
        this.#config.delete(key)
        logger.mark(`[${PluginName}修改配置文件][${key}]`)
      } else {
        const [type, game, name] = key.split('.')
        const defSetPath = this.getConfigPath(type as ConfigType, game as GamePathType, name)
        fs.writeFileSync(defSetPath, (this.getdefSet(name, game as GamePathType, true)).toString(), 'utf8')
        logger.error(`[${PluginName}]请勿对defSet内配置文件进行修改`)
      }
    })

    this.#watcher.set(key, watcher)
  }
})