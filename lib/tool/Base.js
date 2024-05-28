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

  Game (game = false) {
    game = game || this.game
    return ['gs', 'sr', 'zzz'].includes(game)
      ? `components/${Data.gamePath(game)}`
      : ''
  }

  get ModelName () {
    return PluginName + '/' + Data.gamePath(this.game) + this.model
  }

  getBannerFaceImg (game, name = '') {
    const Path = `${dirPath}/${this.Game(game)}resources/meta/character/${name || 'common'}/imgs/`
    return {
      face: `${Path}face.png`,
      banner: `${Path}banner.png`
    }
  }

  /**
   * @param {{scale?:number,test?:boolean,Scale?:boolean}} cfg
   */
  async renderImg (data, cfg = {}) {
    if (data && cfg.test) {
      Data.writeJSON(`data/html/${this.model}/${this.game}/data.json`, data)
    }
    const ImageData = {
      name: this.ModelName,
      ...this.renderData,
      data: {
        ...this.screenData,
        ...((!data && cfg.test)
          ? Data.readJSON(`data/html/${this.model}/${this.game}/data.json`)
          : data),
        sys: {
          scale: cfg.scale || 1
        }
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

  get renderData () {
    return {
      quality: this.set.quality || 100,
      fileID: this.e?.MysUid || this.e?.user_id || this.model,
      file: `./plugins/${PluginName}/${this.Game()}resources/html/${this.model}.html`,
      setViewport: {
        deviceScaleFactor: 1
      }
    }
  }

  get screenData () {
    return {
      useBrowser: '-pu',
      fontsPath: `${dirPath}/resources/fonts/`,
      pluResPath: `${dirPath}/${this.Game()}resources/`,
      res_Path: `${dirPath}/resources/`,
      elemLayout: `${dirPath}/resources/common/layout/elem.html`,
      PluginName
    }
  }
}
