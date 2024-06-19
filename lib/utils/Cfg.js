import chokidar from 'chokidar'
import fs from 'fs'
import _ from 'lodash'
import YAML from 'yaml'
import { dirPath, PluginName } from '../../index.js'
import { CfgSchema } from './CfgSchema.js'
import { Data } from './Data.js'

class Cfg {
  #Cfg = {}
  #watcher = {}
  #PluginConfigView = []
  constructor () {
    this.initCfg('/config')
  }

  /** 初始化配置 */
  async initCfg (Path = '', PathName = '', game = '') {
    if (game && PathName) Data.addGamePath(PathName, game)

    const configPath = `/config/config/${PathName.replace('/', '-')}`
    const defSetPath = `${Path}/${PathName}defSet/`
    if (!fs.existsSync(dirPath + defSetPath)) return

    const files = fs.readdirSync(dirPath + defSetPath).filter(file => file.endsWith('.yaml'))

    files.forEach((file) => {
      const fileName = file.replace('.yaml', '')

      if (!['lable'].includes(fileName)) {
        if (!fs.existsSync(dirPath + configPath + file)) {
          if (fs.existsSync(dirPath + `/config/config/${PathName}` + file)) {
            Data.copyFile(`/config/config/${PathName}${file}`, `${configPath}${file}`)
            fs.rmSync(dirPath + `/config/config/${PathName}`, { recursive: true, force: true })
          } else {
            Data.copyFile(`${defSetPath}${file}`, `${configPath}${file}`)
          }
        } else {
          this.setConfig(this.getConfig(fileName, game))
        }
      } else {
        this.getdefSet(fileName, game, true)
      }
      this.getdefSet(fileName, game)
    })
    Data.createDir(PathName, { root: true })

    const ViewPath = `${Path}/${PathName}PluginConfigView.js`
    if (fs.existsSync(dirPath + ViewPath)) {
      this.#PluginConfigView.push(...(await Data.importDefault(ViewPath)).module)
      this.#PluginConfigView.sort((a, b) => a.priority - b.priority)
      fs.writeFileSync(`${dirPath}/config/PluginConfigView.yaml`, YAML.stringify(this.#PluginConfigView), 'utf8')
    }
  }

  /** 用户配置 */
  getConfig (name, game = '') {
    return { ...this.#getYaml('config', name, game) }
  }

  /** 默认配置 */
  getdefSet (name, game = '', Document = false) {
    const defSet = this.#getYaml('defSet', name, game, Document)
    if (Document) return YAML.parseDocument(defSet.toString())
    return { ...defSet }
  }

  /** 修改用户配置 */
  setConfig (data) {
    if (!data.CfgKey) {
      logger.error('无法识别配置文件')
      return false
    }
    const [type, game, name] = data.CfgKey.split('.')
    const ConfigPath = this.getConfigPath(type, game, name)
    const defSetPath = this.getConfigPath('defSet', game, name)

    let config = {}
    if (fs.existsSync(defSetPath)) {
      const defSet = this.getdefSet(name, game, true)
      _.forEach(data, (value, key) => {
        if (defSet.hasIn([key])) {
          defSet.setIn([key], value)
        } else {
          defSet.deleteIn([key])
        }
      })
      config = defSet.toString()
    } else {
      config = YAML.stringify(data)
    }

    fs.writeFileSync(ConfigPath, config, 'utf8')
  }

  /** 获取配置yaml */
  #getYaml (type, name, game, Document = false) {
    const file = this.getConfigPath(type, game, name)
    if (Document) type += '_Document'
    const key = `${type}.${game}.${name}`

    if (this.#Cfg[key]) return this.#Cfg[key]

    try {
      const data = fs.readFileSync(file, 'utf8')
      this.#Cfg[key] = Document ? YAML.parseDocument(data) : { ...YAML.parse(data), CfgKey: key }
    } catch (error) {
      logger.error(`[${PluginName}][${key}] 格式错误 ${error}`)
      return false
    }
    if (!Document) this.#watch(file, key)
    return this.#Cfg[key]
  }

  /** 获取配置路径 */
  getConfigPath (type, game, name) {
    if (type === 'config') {
      return `${dirPath}/config/config/${Data.gamePath(game).replace('/', '-')}${name}.yaml`
    } else if (game) {
      return `${dirPath}/lib/components/${Data.gamePath(game)}${type}/${name}.yaml`
    } else {
      return `${dirPath}/config/${type}/${name}.yaml`
    }
  }

  readYaml (file, game = '') {
    const path = `${dirPath}/${game ? `lib/components/${Data.gamePath(game)}` : ''}${file}`
    return YAML.parse(fs.readFileSync(path, 'utf8'))
  }

  /** 监听配置文件 */
  #watch (file, key) {

    if (this.#watcher[key]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', () => {
      if (key.includes('config')) {
        delete this.#Cfg[key]
        logger.mark(`[${PluginName}修改配置文件][${key}]`)
      } else {
        const [type, game, name] = key.split('.')
        const defSetPath = this.getConfigPath(type, game, name)
        fs.writeFileSync(defSetPath, (this.getdefSet(name, game, true)).toString(), 'utf8')
        logger.error(`[${PluginName}]请勿对defSet内配置文件进行修改`)
      }
    })
    this.#watcher[key] = watcher
  }

  /** 获取配置图 */
  getCfgSchema () { return CfgSchema }
  getCfgSchemaMap () {
    let ret = {}
    _.forEach(CfgSchema, (cfgGroup) => {
      _.forEach(cfgGroup.cfg, (cfgItem, cfgKey) => {
        cfgItem.cfgKey = cfgKey
        ret[cfgItem.key] = cfgItem
      })
    })
    return ret
  }
}

export default new Cfg()
