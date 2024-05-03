import { dirPath, PluginName } from '../../index.js'
import { Data } from './Data.js'
import Cfg from './Cfg.js'
import { segment, Renderer } from '#Karin'
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

  async renderImg (data, cfg = {}) {
    const ImageData = {
      name: this.ModelName,
      data: {
        ...this.screenData,
        ...data,
        sys: {
          scale: cfg.scale || 1
        }
      }
    }
    const img = this.set.wkhtmltoimage ? await wkhtmltoimage(ImageData) : await Renderer.render(ImageData)
    return segment.image(img)
  }

  get screenData () {
    return {
      quality: this.set.quality || 100,
      saveId: this.e?.MysUid || this.e?.user_id || this.model,
      tplFile: `./plugins/${PluginName}/${this.Game()}resources/html/${this.model}.html`,
      fontsPath: `${dirPath}/resources/fonts/`,
      pluResPath: `${dirPath}/${this.Game()}resources/`,
      res_Path: `${dirPath}/resources/`,
      elemLayout: `${dirPath}/resources/common/layout/elem.html`,
      PluginName
    }
  }
}
