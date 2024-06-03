import _ from 'lodash'
import fs from 'fs'
import util from 'util'
import { dirPath, getDir } from '../../index.js'

const GamePath = {}

const Data = {
  getFilePath (file, Path) {
    if (Path === 'root') return './' + file.replace(/^\//g, '')
    if (Path) return getDir(Path).path + '/' + file.replace(/^\//g, '')
    return dirPath + '/' + file.replace(/^\//g, '')
  },
  copyFile (copy, target) {
    const copyFile = Data.getFilePath(copy)
    const targetFile = Data.createDir(target)
    fs.copyFileSync(copyFile, targetFile)
  },
  /* 根据指定的path依次检查与创建目录 */
  createDir (path, root = false) {
    let file = '/'
    let dirpath = root ? '.' : dirPath

    if (/\.(yaml|json|js|html)$/.test(path)) {
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
  /** 读取json  */
  readJSON (file, Path = '') {
    const path = this.getFilePath(file, Path)
    if (fs.existsSync(path)) {
      try {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
      } catch (e) {
        logger.error(`JSON数据错误: ${path}`)
        logger.error(e)
      }
    }
    return {}
  },
  /** 写入json  */
  writeJSON (file, data, cfg = {}) {
    const path = Data.createDir(file, cfg?.root)
    data = JSON.stringify(data, null, cfg.space || 2)
    if (cfg.rn) {
      data = data.replaceAll('\n', '\r\n')
    }
    return fs.writeFileSync(path, data)
  },
  /** 删除文件 */
  delFile (file) {
    const path = this.getFilePath(file)
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
  async importModule (file, Path = '') {
    const path = this.getFilePath(file, Path)
    if (fs.existsSync(path)) {
      try {
        const module = await import(`file://${path}?t=${new Date() * 1}`) || {}
        return { module, path }
      } catch (e) {
        logger.error(e)
      }
    }
    return {}
  },
  async importDefault (file, Path = '') {
    const ret = await Data.importModule(file, Path)
    return {
      module: ret.module?.default,
      path: ret.path
    }
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
