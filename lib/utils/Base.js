import { render, segment } from '#Karin'
import { dirPath, PluginName } from '../../index.js'
import Cfg from './Cfg.js'
import { Data } from './Data.js'
import { wkhtmltoimage } from './wkhtmltoimage.js'

export default class Base {
  constructor (e = {}, game = '') {
    this.e = e
    this.model = PluginName
    this.game = game
    this.set = Cfg.getConfig('set')
  }
  get redisPrefix () {
    return PluginName + ':' + this.game + ':'
  }

  GamePath (game = false) {
    game = game || this.game
    return ['gs', 'sr', 'zzz'].includes(game)
      ? `lib/components/${Data.gamePath(game)}`
      : ''
  }

  get ModelName () {
    return PluginName + '/' + Data.gamePath(this.game) + this.model
  }

  getBannerFaceImg (game, name = '') {
    const Path = `${dirPath}/${this.GamePath(game)}resources/meta/character/${name || 'common'}/imgs/`
    return {
      face: `${Path}face.png`,
      banner: `${Path}banner.png`
    }
  }

  /**
   * @param {{nowk?:boolean,scale?:number,test?:boolean,Scale?:boolean,wait?:'load'|'domcontentloaded'|'networkidle0'|'networkidle2'}} cfg
   */
  async renderImg (data, cfg = {}) {
    if (data && cfg.test) {
      Data.writeJSON(`html/${this.model}/${this.game}/data.json`, data, { root: true })
    }
    const ImageData = {
      name: this.ModelName,
      fileID: data.uid || this.e?.MysUid || this.e?.user_id || this.model,
      file: `./plugins/${PluginName}/${this.GamePath()}resources/html/${this.model}.html`,
      quality: this.set.quality || 100,
      data: {
        uid: this.e?.MysUid,
        useBrowser: '-pu',
        fontsPath: `${dirPath}/resources/fonts/`,
        pluResPath: `${dirPath}/${this.GamePath()}resources/`,
        res_Path: `${dirPath}/resources/`,
        elemLayout: `${dirPath}/resources/common/layout/elem.html`,
        defaultLayout: `${dirPath}/resources/common/layout/default.html`,
        PluginName,
        ...((!data && cfg.test)
          ? Data.readJSON(`html/${this.model}/${this.game}/data.json`, { root: true })
          : data),
        sys: {
          scale: cfg.scale || 1
        }
      }
      // setViewport: {
      //   deviceScaleFactor: 1
      // }
    }
    if (cfg.wait) {
      ImageData.data.pageGotoParams = {
        waitUntil: cfg.wait
      }
    }
    // if (cfg.Scale) ImageData.quality = 40

    let img = false
    if (this.set.wkhtmltoimage && !cfg.nowk) {
      img = await wkhtmltoimage(ImageData)
    }
    if (!img) {
      img = await render.render(ImageData)
    }
    return segment.image(img)
  }
}
