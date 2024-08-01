import { CfgType, ConfigName, ConfigsType } from '@/types'
import fs from 'fs'
import { logger } from 'node-karin'
import chokidar from 'node-karin/chokidar'
import lodash from 'node-karin/lodash'
import Yaml from 'node-karin/yaml'
import { Data, GamePathType, karinPath } from './Data'
import { PluginName } from './dir'

export const Cfg = new (class Config {
  #config: Map<string, ConfigsType<ConfigName, GamePathType> | Yaml.Document<Yaml.ParsedNode, true>> = new Map()
  #watcher: Map<string, any> = new Map()
  constructor() {
    this.initCfg(GamePathType.Core)
  }

  /** 初始化配置 */
  async initCfg(game: GamePathType) {
    const defSetPath = Data.getFilePath(`config`, game, karinPath.node)
    if (!fs.existsSync(defSetPath)) return false

    const configPath = Data.getFilePath('', game, karinPath.config)
    const files = fs.readdirSync(defSetPath).filter(file => file.endsWith('.yaml'))
    files.forEach((file) => {
      const fileName = file.replace('.yaml', '') as ConfigName

      if (![ConfigName.lables].includes(fileName)) {
        if (!fs.existsSync(`${configPath}/${file}`)) {
          Data.copyFile(`${defSetPath}/${file}`, file, game, karinPath.config)
        } else {
          this.setConfig(fileName, game, this.getConfig(fileName, game))
        }
      } else {
        this.getdefSet(fileName, game, true)
      }
      this.getdefSet(fileName, game)
    })

    const ViewPath = `${defSetPath}/PluginConfigView.js`
    if (fs.existsSync(ViewPath)) {
      fs.writeFileSync(
        `${defSetPath}/PluginConfigView.yaml`,
        Yaml.stringify(
          (await Data.importModule('config/PluginConfigView.js', game, { defData: [] })).module
        ),
        'utf8'
      )
    }
  }

  get package() {
    return Data.readJSON('package.json', GamePathType.Core, karinPath.node)
  }

  /** 获取用户配置 */
  getConfig<N extends ConfigName, G extends GamePathType>(name: N, game: G): ConfigsType<N, G> {
    return { ...this.getdefSet(name, game), ...this.#getYaml(CfgType.config, name, game) }
  }

  /** 获取默认配置 */
  getdefSet(name: ConfigName, game: GamePathType, Document: true): Yaml.Document<Yaml.ParsedNode, true>
  getdefSet(name: ConfigName, game: GamePathType): ConfigsType<ConfigName, GamePathType>
  getdefSet(name: ConfigName, game: GamePathType, Document = false) {
    if (Document) {
      const defSet = this.#getYaml(CfgType.defSet, name, game, true)
      return Yaml.parseDocument(defSet.toString()) as Yaml.Document<Yaml.ParsedNode, true>
    }
    return { ...this.#getYaml(CfgType.defSet, name, game) } as ConfigsType<ConfigName, GamePathType>
  }

  /** 修改用户配置 */
  setConfig(name: ConfigName, game: GamePathType, data: any) {
    const ConfigPath = this.getConfigPath(CfgType.config, game as GamePathType, name)
    const defSetPath = this.getConfigPath(CfgType.defSet, game as GamePathType, name)

    let config: string
    if (fs.existsSync(defSetPath)) {
      const defSet = this.getdefSet(name as ConfigName, game as GamePathType, true)
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
  #getYaml(type: CfgType, name: ConfigName, game: GamePathType, Document: true): Yaml.Document<Yaml.ParsedNode, true>
  #getYaml<N extends ConfigName, G extends GamePathType>(type: CfgType, name: N, game: G): ConfigsType<N, G>
  #getYaml(type: CfgType, name: ConfigName, game: GamePathType, Document = false) {
    const file = this.getConfigPath(type, game, name)
    const key = `${Document ? (type + '_Document') : type}.${game}.${name}`

    let cfg = this.#config.get(key)
    if (cfg) return cfg

    try {
      const data = fs.readFileSync(file, 'utf8')
      cfg = Document ? Yaml.parseDocument(data) : Yaml.parse(data)
      this.#config.set(key, cfg)
    } catch (error) {
      logger.error(`[${PluginName}][${key}] 格式错误 ${error}`)
      throw error
    }

    if (!Document) this.#watch(file, key)
    return cfg
  }

  /** 获取配置路径 */
  getConfigPath(type: CfgType, game: GamePathType, name: string) {
    if (type === CfgType.config) {
      return Data.getFilePath(`${name}.yaml`, game, karinPath.config)
    } else {
      return Data.getFilePath(`config/${name}.yaml`, game, karinPath.node)
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
        const defSetPath = this.getConfigPath(type as CfgType, game as GamePathType, name)
        fs.writeFileSync(defSetPath, (this.getdefSet(name as ConfigName, game as GamePathType, true)).toString(), 'utf8')
        logger.error(`[${PluginName}]请勿对defSet内配置文件进行修改`)
      }
    })

    this.#watcher.set(key, watcher)
  }
})