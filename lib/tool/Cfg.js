import chokidar from 'chokidar'
import _ from 'lodash'
import fs from 'fs'
import YAML from 'yaml'
import { dirPath, PluginName } from '../../index.js'
import { CfgSchema } from './CfgSchema.js'
import { Data } from './Data.js'

const components = { '': '', gs: '/components/Genshin', sr: '/components/StarRail' }
class Cfg {
  constructor () {
    this.Cfg = {}
    this.watcher = {}
    this.initCfg()
  }

  // todo 优化初始化配置文件
  /** 初始化配置 */
  initCfg () {
    _.forEach(components, (Path, game) => {
      const configPath = `${dirPath}${Path}/config/config/`
      const defSetPath = `${dirPath}${Path}/config/defSet/`

      const files = fs.readdirSync(defSetPath).filter(file => file.endsWith('.yaml'))

      files.forEach((file) => {
        if (!['lable.yaml'].includes(file)) {
          if (!fs.existsSync(`${configPath}${file}`)) {
            fs.copyFileSync(`${defSetPath}${file}`, `${configPath}${file}`)
          } else {
            this.setConfig(this.getYaml('config', file.replace('.yaml', ''), game))
          }
        }
      })

      Data.createDir(`data${Path}/`.replace('/components', ''))
    })
  }

  /** package.json */
  get package () {
    if (this._package) return this._package
    this._package = JSON.parse(fs.readFileSync(dirPath + '/package.json', 'utf8'))
    return this._package
  }

  /** 用户配置 */
  getConfig (name, game = '') {
    return this.getYaml('config', name, game)
  }

  /** 默认配置 */
  getdefSet (name, game = '', Document = false) {
    return this.getYaml('defSet', name, game, Document)
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
  getYaml (type, name, game, Document = false) {
    const file = this.getConfigPath(type, game, name)
    const key = `${type}.${game}.${name}`

    if (Document) type += '_Document'
    if (this.Cfg[key]) return this.Cfg[key]

    try {
      const data = fs.readFileSync(file, 'utf8')
      this.Cfg[key] = Document ? YAML.parseDocument(data) : { ...YAML.parse(data), CfgKey: key }
    } catch (error) {
      logger.error(`[${PluginName}][${key}] 格式错误 ${error}`)
      return false
    }

    this.watch(file, key)
    return this.Cfg[key]
  }

  /** 获取配置路径 */
  getConfigPath (type, game, name) {
    return `${dirPath}/${game ? `components/${Data.gamePath(game)}` : ''}config/${type}/${name}.yaml`
  }

  /** 监听配置文件 */
  watch (file, key) {
    if (this.watcher[key]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', () => {
      delete this.Cfg[key]
      logger.mark(`[${PluginName}修改配置文件][${key}]`)
    })
    this.watcher[key] = watcher
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
