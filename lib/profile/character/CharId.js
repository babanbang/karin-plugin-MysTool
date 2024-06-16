import _ from 'lodash'
import { Meta, Format } from '../index.js'

const CharId = {
  getId (ds = '', game = '', elem = '') {
    if (!ds) return false

    if (_.isObject(ds)) {
      const em = Format.elem(ds.elem || ds.element, game)
      for (const key of ['id', 'name']) {
        if (!ds[key]) continue
        const ret = CharId.getId(ds[key], game, em || '')
        if (ret) return ret
      }
      return false
    }

    const ret = (data, game = 'gs', em = '') => {
      if (data.data) data = data.data
      const { id, name } = data
      return { id, data, name, game, elem: em || elem }
    }

    const match = Meta.matchGame(game, 'char', ds)
    if (match) return ret(match, match.game)

    if (game !== 'sr') {
      // 尝试使用元素起始匹配
      const em = Format.matchElem(ds, '', true)
      if (em) {
        const match = Meta.getData('gs', 'char', em.name)
        if (match && CharId.isTraveler(match.id)) {
          return ret(match, 'gs', em.elem)
        }
      }
    }
    // 无匹配结果
    return false
  },

  isTraveler (id) {
    if (id) {
      return [10000007, 10000005, 20000000].includes(id * 1)
    }
    return false
  },

  isTrailblazer (id) {
    if (id) {
      return [8001, 8002, 8003, 8004, 8005, 8006].includes(id * 1)
    }
    return false
  }

}
export default CharId
