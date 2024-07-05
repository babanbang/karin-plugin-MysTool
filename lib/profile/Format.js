import { Data } from '#MysTool/utils'
import lodash from 'lodash'

const elemAlias = {
  anemo: '风,蒙德',
  geo: '岩,璃月',
  electro: '雷,电,雷电,稻妻',
  dendro: '草,须弥',
  pyro: '火,纳塔',
  hydro: '水,枫丹',
  cryo: '冰,至冬'
}

const elemAliasSR = {
  fire: '火',
  ice: '冰',
  wind: '风',
  elec: '雷',
  phy: '物理',
  quantum: '量子',
  imaginary: '虚数'
}

const elemAliasZZZ = {
  fire: '火',
  ice: '冰',
  elec: '电',
  phy: '物理',
  ether: '以太'
}

// 元素属性映射, 名称=>elem
const elemMap = {
  gs: {},
  sr: {},
  zzz: {}
}

// 标准元素名
const elemTitleMap = {
  gs: {},
  sr: elemAliasSR,
  zzz: elemAliasZZZ
}

lodash.forEach(elemAlias, (txt, key) => {
  elemMap.gs[key] = key
  elemTitleMap.gs[key] = txt[0]
  Data.eachStr(txt, (t) => (elemMap.gs[t] = key))
})
lodash.forEach(elemAliasSR, (txt, key) => {
  elemMap.sr[key] = key
  elemMap.sr[txt] = key
})
lodash.forEach(elemAliasZZZ, (txt, key) => {
  elemMap.zzz[key] = key
  elemMap.zzz[txt] = key
})

const Format = {
  /** 根据名称获取元素key */
  elem (elem = '', game = 'gs', defElem = '') {
    return (elemMap[game])[elem.toLowerCase()] || defElem
  },

  /** 根据key获取元素名 */
  elemName (elem = '', game = 'gs', defName = '') {
    return elemTitleMap[this.elem(elem, game)] || defName
  },

  // 从字符串中匹配元素
  matchElem (name = '', defElem = '', withName = false) {
    const elemReg = new RegExp(`^(${lodash.keys(elemMap).join('|')})`)
    const elemRet = elemReg.exec(name)
    const elem = (elemRet && elemRet[1]) ? this.elem(elemRet[1]) : defElem
    if (elem) {
      if (withName) {
        return {
          elem,
          name: name.replace(elemReg, '')
        }
      }
      return elem
    }
    return ''
  },

  eachElem (fn, game = 'gs') {
    lodash.forEach(elemTitleMap[game], (title, key) => {
      fn(key, title)
    })
  },

  isElem (elem = '', game = 'gs') {
    return !!(elemMap[game])[elem]
  },

  sameElem (key1, key2, game = 'gs') {
    const map = (elemMap[game])
    return map[key1] === map[key2]
  },
  int: function (d) {
    return parseInt(d)
  },
  comma: function (num, fix = 0) {
    num = parseFloat((num * 1).toFixed(fix))
    let [integer, decimal] = String.prototype.split.call(num, '.')
    integer = integer.replace(/\d(?=(\d{3})+$)/g, '$&,') // 正则先行断言 = /\d(?=(\d{3})+$)/g
    return `${integer}${fix > 0 ? '.' + (decimal || lodash.repeat('0', fix)) : ''}`
  },
  pct: function (num, fix = 1) {
    return (num * 1).toFixed(fix) + '%'
  },
  percent: function (num, fix = 1) {
    return Format.pct(num * 100, fix)
  }
}

export default Format
