import fs from 'fs'
import _ from 'lodash'
import Base from './Base.js'
import DmgAttr from './dmg/DmgAttr.js'
import DmgBuffs from './dmg/DmgBuffs.js'
import DmgCalc from './dmg/DmgCalc.js'
import { Character, Meta } from './index.js'
import { Data } from '#Mys.tool'

export default class ProfileDmg extends Base {
  constructor (profile = {}, game = 'gs') {
    super(game)
    this.profile = profile
    this.game = game
    this._update = profile._update
    if (profile && profile.id) {
      let { id } = profile
      this.char = Character.get(id)
    }
  }

  static dmgRulePath (name, game = 'gs') {
    const Profile = new ProfileDmg({}, game)
    let dmgFile = [
      { file: 'calc_user', name: '自定义伤害' },
      // { file: 'calc_auto', name: '组团伤害', test: () => Common.cfg('teamCalc') },
      { file: 'calc', name: '喵喵' }
    ]
    for (let ds of dmgFile) {
      const path = Data.getFilePath(`${Profile.metaPath}/character/${name}/${ds.file}.js`)
      if (ds.test && !ds.test()) {
        continue
      }
      if (fs.existsSync(path)) {
        return { path, createdBy: ds.name }
      }
    }
    return false
  }

  // 获取天赋数据
  talent () {
    let char = this.char
    let profile = this.profile
    let ret = {}
    let talentData = profile.talent || {}
    let detail = char.detail
    let { isSr, isGs } = this
    _.forEach((isSr ? 'a,a2,e,e2,q,q2,t' : 'a,e,q').split(','), (key) => {
      let level = _.isNumber(talentData[key]) ? talentData[key] : (talentData[key]?.level || 1)
      let keyRet = /^(a|e|q)2$/.exec(key)
      if (keyRet) {
        let tmpKey = keyRet[1]
        level = _.isNumber(talentData[tmpKey]) ? talentData[tmpKey] : (talentData[tmpKey]?.level || 1)
      }
      let map = {}
      if (isGs && detail.talentData) {
        _.forEach(detail.talentData[key], (ds, key) => {
          map[key] = ds[level - 1]
        })
      } else if (isSr && detail.talent && detail.talent[key]) {
        _.forEach(detail.talent[key].tables, (ds) => {
          map[ds.name] = ds.values[level - 1]
        })
      }
      ret[key] = map
    })
    return ret
  }

  trees () {
    let ret = {}
    let reg = /\d{4}(\d{3})/
    _.forEach(this.profile.trees, (t) => {
      let regRet = reg.exec(t)
      if (regRet && regRet[1]) {
        ret[regRet[1]] = true
      }
    })
    return ret
  }

  // 获取buff列表
  getBuffs (buffs) {
    return DmgBuffs.getBuffs(this.profile, buffs, this.game)
  }

  async getCalcRule () {
    let ruleName = this.char?.name
    if (['空', '荧'].includes(ruleName)) {
      ruleName = `旅行者/${this.profile.elem}`
    }
    const cfgPath = ProfileDmg.dmgRulePath(ruleName, this.char?.game)
    let cfg = {}
    if (cfgPath) {
      cfg = await import(`file://${cfgPath.path}`)
      // 文件中定义了createBy的话，优先进行展示
      let createdBy = cfg.createdBy || cfgPath.createdBy || '喵喵'
      return {
        createdBy: createdBy.slice(0, 15),
        details: cfg.details || false, // 计算详情
        buffs: cfg.buffs || [], // 角色buff
        defParams: cfg.defParams || {}, // 默认参数，一般为空
        defDmgIdx: cfg.defDmgIdx || -1, // 默认详情index
        defDmgKey: cfg.defDmgKey || '',
        mainAttr: cfg.mainAttr || 'atk,cpct,cdmg', // 伤害属性
        enemyName: cfg.enemyName || this.isGs ? '小宝' : '弱点敌人' // 敌人名称
      }
    }
    return false
  }

  async calcData ({ enemyLv = 91, mode = 'dmg', dmgIdx = 0 }) {
    if (!this.char || !this.profile) {
      return false
    }
    let { profile } = this
    let { game } = this.char
    let sp = this.detail?.sp
    let charCalcData = await this.getCalcRule()

    if (!charCalcData) return false

    let { createdBy, buffs, details, defParams, mainAttr, defDmgIdx, defDmgKey, enemyName } = charCalcData

    const talent = this.talent()
    const meta = {
      level: profile.level,
      cons: profile.cons * 1,
      talent,
      trees: this.trees(),
      weapon: profile.weapon
    }

    let { id, weapon, attr, artis } = profile

    defDmgKey = _.isFunction(defDmgKey) ? defDmgKey(meta) : defDmgKey
    defDmgIdx = _.isFunction(defDmgIdx) ? defDmgIdx(meta) : defDmgIdx
    defParams = _.isFunction(defParams) ? defParams(meta) : defParams || {}

    let originalAttr = DmgAttr.getAttr({ id, weapon, attr, char: this.char, game, sp })

    buffs = this.getBuffs(buffs)

    let { msg } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta, params: defParams || {}, game })
    let msgList = []

    let ret = []
    let detailMap = []
    const dmgRet = []
    let dmgDetail = {}

    // 用户手动输入伤害序号
    if (dmgIdx) {
      // 从1开始，所以需要 - 1
      defDmgIdx = --dmgIdx < 0 ? 0 : dmgIdx
    }

    _.forEach(details, (detail, detailSysIdx) => {
      if (mode === 'single') {
        if (defDmgKey) {
          if (detail.dmgKey !== defDmgKey) {
            return true
          }
        } else if (detailSysIdx !== dmgIdx) {
          return true
        }
      }

      if (_.isFunction(detail)) {
        let { attr } = DmgAttr.calcAttr({ originalAttr, artis, buffs, meta })
        let ds = _.merge({ talent }, DmgAttr.getDs(attr, meta))
        detail = detail({ ...ds, attr, profile })
      }
      let params = _.merge({}, defParams, _.isFunction(detail?.params) ? detail?.params(meta) : detail?.params || {})
      let { attr, msg } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta, params, talent: detail.talent || '', game })
      if (detail.isStatic) {
        return
      }

      let ds = _.merge({ talent }, DmgAttr.getDs(attr, meta, params))
      ds.artis = artis
      if (detail.check && !detail.check(ds)) {
        return
      }
      if (detail.cons && meta.cons < detail.cons * 1) {
        return
      }

      let dmg = DmgCalc.getDmgFn({ ds, attr, level: profile.level, enemyLv, showDetail: detail.showDetail, game })
      let basicDmgRet

      if (detail.dmg) {
        basicDmgRet = detail.dmg(ds, dmg)
        detail.userIdx = detailMap.length
        detailMap.push(detail)
        ret.push({
          title: detail.title,
          ...basicDmgRet
        })
      }
      msgList.push(msg)
    })

    if (mode === 'dmg') {
      let detail
      if (!_.isUndefined(defDmgIdx) && detailMap[defDmgIdx]) {
        detail = detailMap[defDmgIdx]
      } else if (dmgIdx) {
        // 当用户输入的下标错误时，提示错误
        throw new Error(`序号输入错误：${this.char.name}最多只支持${detailMap.length}种伤害计算哦`)
      } else {
        detail = detailMap[0]
      }

      if (_.isFunction(detail)) {
        let { attr } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta })
        let ds = _.merge({ talent }, DmgAttr.getDs(attr, meta))
        detail = detail({ ...ds, attr, profile })
      }
      dmgDetail = {
        title: detail.title,
        userIdx: detail.userIdx || defDmgIdx,
        basicRet: _.merge({}, ret[detail.userIdx] || ret[defDmgIdx]),
        attr: []
      }

      let { attrMap } = Meta.getMeta(game, 'arti')

      // 计算角色属性增减
      mainAttr = mainAttr.split(',')
      let params = _.merge({}, defParams, detail.params || {})
      let basicDmg = dmgDetail.basicRet
      _.forEach(mainAttr, (reduceAttr) => {
        dmgDetail.attr.push(attrMap[reduceAttr])
        let rowData = []
        _.forEach(mainAttr, (incAttr) => {
          if (incAttr === reduceAttr) {
            rowData.push({ type: 'na' })
            return
          }
          let { attr } = DmgAttr.calcAttr({
            originalAttr,
            buffs,
            artis,
            meta,
            params,
            incAttr,
            reduceAttr,
            talent: detail.talent || '',
            game
          })
          let ds = _.merge({ talent }, DmgAttr.getDs(attr, meta, params))
          let dmg = DmgCalc.getDmgFn({ ds, attr, level: profile.level, enemyLv, game })
          if (detail.dmg) {
            let dmgCalcRet = detail.dmg(ds, dmg)
            rowData.push({
              type: dmgCalcRet.avg === basicDmg.avg ? 'avg' : (dmgCalcRet.avg > basicDmg.avg ? 'gt' : 'lt'),
              ...dmgCalcRet
            })
          }
        })
        dmgRet.push(rowData)
      })
    }

    if (mode === 'single') {
      return ret[0]
    }
    return {
      ret,
      // 根据当前计算的伤害，显示对应的buff列表
      msg: msgList[defDmgIdx] || msg,
      msgList,
      dmgRet,
      enemyName,
      dmgCfg: dmgDetail,
      enemyLv,
      createdBy
    }
  }
}
