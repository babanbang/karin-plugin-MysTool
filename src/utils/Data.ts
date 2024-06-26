import fs from 'fs'
import _ from 'lodash'
import util from 'util'
import { dirPath, getDir, PluginName } from '../../index.js'

const GamePath = {}

/**
 * @typedef {Object} cfg
 * @property {boolean} [root] - Use root path if true.
 * @property {boolean} [temp] - Use temp path if true.
 * @property {string} [Path] - Custom path if specified.
 */

const Data = {
  /** 
   * @param {cfg} cfg  
   * */
  getFilePath (file, cfg = {}) {
    if (cfg?.temp) return `./temp/${PluginName}/` + file.replace(/^\//g, '')
    if (cfg?.root) return `./data/${PluginName}/` + file.replace(/^\//g, '')
    if (cfg?.Path) return getDir(cfg.Path).path + '/' + file.replace(/^\//g, '')
    return dirPath + '/' + file.replace(/^\//g, '')
  },
  /** 
   * @param {cfg} cfg  
   * */
  isDirectory (path, cfg = {}) {
    const _path = this.getFilePath(path, cfg)
    return fs.statSync(_path).isDirectory()
  },
  /**
   * @param {Array} dir
   * @param {cfg} cfg
  */
  createDirs (dir, cfg = {}) {
    dir.forEach(i => {
      Data.createDir(i, cfg)
    })
  },
  /** @param {cfg} cfg */
  copyFile (copy, target, cfg = {}) {
    const copyFile = Data.getFilePath(copy, cfg)
    const targetFile = Data.createDir(target, cfg)
    fs.copyFileSync(copyFile, targetFile)
  },
  /** 
   * @param {cfg} cfg 
   * */
  readdir (dir, cfg = {}) {
    const path = this.getFilePath(dir, cfg)
    if (!fs.existsSync(path)) return []
    return fs.readdirSync(path)
  },
  /** 
   * @param {cfg} cfg 
   * */
  exists (path, cfg = {}) {
    const _path = this.getFilePath(path, cfg)
    return fs.existsSync(_path)
  },
  /** 
   * 根据指定的path依次检查与创建目录
   * @param {{root?: boolean, temp?: boolean}} cfg 
   */
  createDir (path, cfg = {}) {
    let file = '/'
    let dirpath = cfg?.temp ? `./temp/${PluginName}`
      : cfg?.root ? `./data/${PluginName}` : dirPath

    if (/\.(yaml|json|js|html|db)$/.test(path)) {
      const idx = path.lastIndexOf('/') + 1
      file += path.substring(idx)
      path = path.substring(0, idx)
    }
    path = path.replace(/^\/+|\/+$/g, '')
    if (fs.existsSync(dirpath + '/' + path)) {
      return dirpath + '/' + path + file
    }

    const pathList = path.split('/')
    let nowPath = dirpath + '/'
    pathList.forEach(name => {
      nowPath += name + '/'
      if (!fs.existsSync(nowPath)) {
        fs.mkdirSync(nowPath)
      }
    })
    return nowPath + file
  },
  async forEach (data, fn) {
    if (_.isArray(data)) {
      for (let idx = 0; idx < data.length; idx++) {
        let ret = fn(data[idx], idx)
        ret = Data.isPromise(ret) ? await ret : ret
        if (ret === false) {
          break
        }
      }
    } else if (_.isPlainObject(data)) {
      for (const idx in data) {
        let ret = fn(data[idx], idx)
        ret = Data.isPromise(ret) ? await ret : ret
        if (ret === false) {
          break
        }
      }
    }
  },
  isPromise (data) {
    return util.types.isPromise(data)
  },
  /*
  * 返回一个从 target 中选中的属性的对象
  *
  * keys : 获取字段列表，逗号分割字符串
  *   key1, key2
  *
  * def: 当某个字段为空时会选取def的对应内容
  * */
  getData (target = {}, keys = '', def = {}) {
    const ret = {}
    // 分割逗号
    if (typeof keys === 'string') {
      keys = keys.split(',')
    }

    _.forEach(keys, (key) => {
      const _key = key.split(':')
      ret[_key[0].trim()] = _.get(target, (_key[1] || _key[0]).trim(), def[key])
    })
    return ret
  },
  /** 
   * 读取json
   * @param {{root?: boolean, temp?: boolean,Path?: string, def?: any}} cfg
   * */
  readJSON (file, cfg = {}) {
    const path = this.getFilePath(file, cfg)
    if (fs.existsSync(path)) {
      try {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (e) {
        logger.error(`JSON数据错误: ${path}`)
        logger.error(e)
      }
    }
    return cfg.def
  },
  /** 
   * 写入json
   * @param {{rn?: boolean, space?: number, root?: boolean,temp?: boolean,Path?: string}} cfg 
  */
  writeJSON (file, data, cfg = {}) {
    const path = Data.createDir(file, cfg)
    data = JSON.stringify(data, null, cfg.space || 2)
    if (cfg.rn) {
      data = data.replaceAll('\n', '\r\n')
    }
    fs.writeFileSync(path, data)
    return path
  },
  /** 
   * 删除文件
   * @param {cfg} cfg
   * */
  delFile (file, cfg = {}) {
    const path = this.getFilePath(file, cfg)
    try {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path)
      }
      return true
    } catch (error) {
      logger.error(`文件删除失败：${error}`)
    }
    return false
  },
  addGamePath (file, game) {
    GamePath[game] = file
  },
  gamePath (game) {
    return GamePath[game] || ''
  },
  /** 循环字符串回调 */
  eachStr: (arr, fn) => {
    if (_.isString(arr)) {
      arr = arr.replace(/\s*(;|；|、|，)\s*/, ',')
      arr = arr.split(',')
    } else if (_.isNumber(arr)) {
      arr = [arr.toString()]
    }
    _.forEach(arr, (str, idx) => {
      if (!_.isUndefined(str)) {
        fn(str.trim ? str.trim() : str, idx)
      }
    })
  },
  /** @param {{root?: boolean, temp?: boolean,Path?: string,mode?: string}} cfg */
  async importModule (file, cfg = {}) {
    const path = this.getFilePath(file, cfg)
    if (fs.existsSync(path)) {
      try {
        const module = await import(`file://${path}?t=${new Date() * 1}`) || {}
        return { module: module?.[cfg.mode], path }
      } catch (e) {
        logger.error(e)
      }
    }
    return {}
  },
  /** @param {cfg} cfg */
  async importDefault (file, cfg = {}) {
    return await Data.importModule(file, { ...cfg, mode: 'default' })
  },
  regRet (reg, txt, idx) {
    if (reg && txt) {
      let ret = reg.exec(txt)
      if (ret && ret[idx]) {
        return ret[idx]
      }
    }
    return false
  }
}

export { Data }
