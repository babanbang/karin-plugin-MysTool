import { logger } from 'node-karin'
import { yaml as Yaml, chokidar, fs, lodash } from 'node-karin/modules.js'
import { Data, GamePathType } from './Data'
import { PluginName } from './dir'

type ConfigType = 'config' | 'defSet'

export const Cfg = new (class Config {
  #config: Map<string, any> = new Map()
  #watcher: Map<string, any> = new Map()
  constructor() {
    this.initCfg(GamePathType.Core)
  }

  /** 初始化配置 */
  async initCfg(game: GamePathType) {
    const PathName = Data.getGamePath(game)

    const defSetPath = Data.getFilePath(`${PathName}/config`, { k: 'plugins' })
    if (!fs.existsSync(defSetPath)) return false

    const configPath = Data.getFilePath('', { k: 'config/plugin' })
    const files = fs.readdirSync(defSetPath).filter(file => file.endsWith('.yaml'))
    files.forEach((file) => {
      const fileName = file.replace('.yaml', '')

      if (!['lable', 'PluginConfigView'].includes(fileName)) {
        if (!fs.existsSync(`${configPath}/${file}`)) {
          Data.copyFile(`${defSetPath}/${file}`, `${configPath}/${file}`)
        } else {
          this.setConfig(this.getConfig(fileName, game))
        }
      } else {
        this.getdefSet(fileName, game, true)
      }
      this.getdefSet(fileName, game)
    })
    Data.createDir(Data.getGamePath(game, true), { k: 'data' })

    const ViewPath = `${defSetPath}/PluginConfigView.js`
    if (fs.existsSync(ViewPath)) {
      fs.writeFileSync(
        `${defSetPath}/PluginConfigView.yaml`,
        Yaml.stringify(
          (await Data.importModule(ViewPath, { defData: [] })).module
        ),
        'utf8'
      )
    }
  }

  get package() {
    return Data.readJSON('package.json')
  }

  /** 用户配置 */
  getConfig(name: string, game: GamePathType) {
    return { ...this.#getYaml('config', name, game) }
  }

  /** 默认配置 */
  getdefSet(name: string, game: GamePathType, Document = false) {
    const defSet = this.#getYaml('defSet', name, game, Document)
    if (Document) return Yaml.parseDocument(defSet.toString())
    return { ...defSet }
  }

  /** 修改用户配置 */
  setConfig(data: {
    [key: string]: any,
    CfgKey: string
  }) {
    if (!data.CfgKey) {
      logger.error('无法识别配置文件')
      return false
    }
    const [type, game, name] = data.CfgKey.split('.')
    const ConfigPath = this.getConfigPath('config', game as GamePathType, name)
    const defSetPath = this.getConfigPath('defSet', game as GamePathType, name)

    let config = ''
    if (fs.existsSync(defSetPath)) {
      const defSet = this.getdefSet(name, game as GamePathType, true)
      lodash.forEach(data, (value, key) => {
        if (defSet.hasIn([key])) {
          defSet.setIn([key], value)
        } else {
          defSet.deleteIn([key])
        }
      })
      config = defSet.toString()
    } else {
      config = Yaml.stringify(data)
    }

    fs.writeFileSync(ConfigPath, config, 'utf8')
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
      return Data.getFilePath(`${Data.getGamePath(game)}${name}.yaml`, { k: 'config/plugin' })
    } else {
      return Data.getFilePath(`${Data.getGamePath(game)}${name}.yaml`, { k: 'plugins' })
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