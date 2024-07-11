import fs from 'fs'
import { dirPath } from '#MysTool/utils'

const res_Path = {
  gs: dirPath + '/lib/components/Genshin/resources/',
  sr: dirPath + '/lib/components/StarRail/resources/'
}
const CharImg = {
  /** 获取角色的图像资源数据 */
  getImgs (name, game, Cons, elem = '', weaponType = 'sword', costume = '') {
    const imgs = {}
    const _name = 'meta/character/' + name
    let name_path = _name
    if (['空', '荧', '旅行者'].includes(name)) {
      name_path = 'meta/character/旅行者/' + elem
    }
    const add = (key, path, path2) => {
      if (path2 && fs.existsSync(`${res_Path[game]}/${_name}/${path2}.png`)) {
        imgs[key] = `${_name}/${path2}.png`
      } else {
        imgs[key] = `${_name}/${path}.png`
      }
    }

    const tAdd = (key, path) => {
      imgs[key] = `${name_path}/${path}.png`
    }

    if (game == 'gs') {
      costume = costume === '2' ? '2' : ''

      add('splash', 'imgs/splash', `imgs/splash${costume}`)
      add('face', 'imgs/face', `imgs/face${costume}`)
      add('side', 'imgs/side', `imgs/side${costume}`)
      add('qFace', 'imgs/face', 'imgs/face-q')
      add('gacha', 'imgs/gacha')

      tAdd('banner', 'imgs/banner')
      tAdd('card', 'imgs/card')
      for (let i = 1; i <= 6; i++) {
        tAdd(`cons${i}`, `icons/cons-${i}`)
      }
      for (let i = 0; i <= 3; i++) {
        tAdd(`passive${i}`, `icons/passive-${i}`)
      }
      imgs.a = `meta/common/item/atk-${weaponType}.png`
      for (let t of ['e', 'q']) {
        imgs[t] = Cons[t] > 0 ? imgs[`cons${Cons[t]}`] : `${_name}/icons/talent-${t}.png`
      }
    } else if (game == 'sr') {
      tAdd('face', 'imgs/face')
      add('qFace', 'imgs/face', 'imgs/face-q')
      tAdd('splash', 'imgs/splash')
      tAdd('preview', 'imgs/preview')
      for (let i = 1; i <= 3; i++) {
        tAdd(`tree${i}`, `imgs/tree-${i}`)
      }
      for (let key of ['a', 'e', 'q', 't', 'z', 'a2', 'e2', 'q2']) {
        tAdd(key, `imgs/talent-${key}`)
      }
      for (let i = 1; i <= 6; i++) {
        if (i !== 3 && i !== 5) {
          tAdd(`cons${i}`, `imgs/cons-${i}`)
        }
      }
      imgs.banner = 'meta/character/common/imgs/banner.png'
      imgs.card = 'meta/character/common/imgs/card.png'
      imgs.cons3 = imgs[Cons[3]]
      imgs.cons5 = imgs[Cons[5]]
    } else {
      tAdd('face', 'imgs/face')
      tAdd('splash', 'imgs/splash')
      tAdd('vertical', 'imgs/vertical')
      
      imgs.banner = 'meta/character/common/imgs/banner.png'
      imgs.card = 'meta/character/common/imgs/card.png'
    }
    return imgs
  }
}
export default CharImg
