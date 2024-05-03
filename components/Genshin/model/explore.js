import { Base, Cfg } from '#Mys.tool'
import { MysInfo } from '#Mys.api'
import { Player } from '#Mys.rank'
import _ from 'lodash'

export default class Explore extends Base {
  constructor (e) {
    super(e, 'gs')
    this.model = 'explore/explore'
    this.lable = Cfg.getdefSet('lable', 'gs')

    this.area = {
      蒙德: 1,
      璃月: 2,
      雪山: 3,
      稻妻: 4,
      渊下宫: 5,
      层岩巨渊: 6,
      层岩地下: 7,
      须弥: 8,
      枫丹: 9,
      沉玉谷: 10,
      来歆山: 11,
      // eslint-disable-next-line quote-props
      '沉玉谷·南陵': 12,
      // eslint-disable-next-line quote-props
      '沉玉谷·上谷': 13,
      旧日之海: 14
    }

    this.all_chest = 0
    _.forEach(this.lable, (v, i) => {
      if (i.includes('_chest')) this.all_chest += v
    })

    this.areaName = _.invert(this.area)
  }

  async get () {
    const res = await MysInfo.get(this.e, 'index')
    if (res?.retcode !== 0) return false

    const exploreInfo = { version: this.lable.version }
    const player = new Player(this.e.MysUid, 'gs')
    player.setBasicData(res.data.role, true)

    exploreInfo.role = res.data.role
    exploreInfo.avatars = res.data.avatars.filter(i => i.is_chosen)
    if (exploreInfo.avatars.length < 8) {
      exploreInfo.avatars = res.data.avatars.splice(0, 8)
    }

    const stats = res.data.stats
    let all_chest = 0
    _.forEach(stats, (v, i) => {
      if (i.includes('_chest') && typeof v === 'number') all_chest += v
    })
    const percentage = _.round((all_chest / this.all_chest) * 100, 1)

    exploreInfo.explores = {
      line: [
        { lable: '活跃天数', num: stats.active_day_number, extra: Math.floor((new Date() - new Date('2020-09-15')) / (1000 * 60 * 60 * 24)) + 1 },
        { lable: '深境螺旋', num: stats.spiral_abyss },
        { lable: '解锁传送点', num: stats.way_point_number, extra: this.lable.way_point },
        { lable: '宝箱获取率', num: percentage + '%' }
      ],
      other: [
        { lable: '成就达成数', num: stats.achievement_number, extra: this.lable.achievement },
        { lable: '获得角色数', num: stats.avatar_number, extra: this.lable.avatar },
        { lable: '解锁秘境', num: stats.domain_number, extra: this.lable.domain },
        { lable: '水神瞳', num: stats.hydroculus_number, extra: this.lable.hydroculus },
        { lable: '风神瞳', num: stats.anemoculus_number, extra: this.lable.anemoculus },
        { lable: '岩神瞳', num: stats.geoculus_number, extra: this.lable.geoculus },
        { lable: '雷神瞳', num: stats.electroculus_number, extra: this.lable.electroculus },
        { lable: '草神瞳', num: stats.dendroculus_number, extra: this.lable.dendroculus },
        { lable: '总宝箱', num: all_chest, extra: this.all_chest },
        { lable: '华丽宝箱', num: stats.luxurious_chest_number, extra: this.lable.luxurious_chest },
        { lable: '珍贵宝箱', num: stats.precious_chest_number, extra: this.lable.precious_chest },
        { lable: '精致宝箱', num: stats.exquisite_chest_number, extra: this.lable.exquisite_chest },
        { lable: '普通宝箱', num: stats.common_chest_number, extra: this.lable.common_chest },
        { lable: '奇馈宝箱', num: stats.magic_chest_number, extra: this.lable.magic_chest }
      ]
    }

    exploreInfo.world = []
    for (let val of res.data.world_explorations) {
      if ([7, 11, 12, 13].includes(val.id)) continue

      val.name = this.areaName[val.id] ? this.areaName[val.id] : _.truncate(val.name, { length: 6 })

      const tmp = {
        name: val.name,
        line: [
          {
            name: val.name,
            text: `${val.exploration_percentage / 10}%`
          }
        ]
      }

      if (val.id == 10) tmp.line = []

      if (['蒙德', '璃月', '稻妻', '须弥', '枫丹'].includes(val.name)) {
        tmp.line.push({ name: '声望', text: `${val.level}级` })
      }

      if ([6, 10].includes(val.id)) {
        let oidArr = [7]
        if (val.id == 10) oidArr = [13, 12, 11]
        for (let oid of oidArr) {
          const underground = _.find(res.data.world_explorations, function (o) {
            return o.id == oid
          })
          if (underground) {
            tmp.line.push({
              name: this.areaName[underground.id],
              text: `${underground.exploration_percentage / 10}%`
            })
          }
        }
      }

      if (['雪山', '稻妻', '层岩巨渊', '须弥', '枫丹', '沉玉谷'].includes(val.name)) {
        if (val.offerings[0].name.includes('流明石')) {
          val.offerings[0].name = '流明石'
        }

        if (val.offerings[0].name.includes('露景泉')) {
          val.offerings[0].name = '露景泉'
        }

        if (val.offerings[0].name == '桓那兰那的梦之树') {
          val.offerings[0].name = '梦之树'
        }

        tmp.line.push({
          name: val.offerings[0].name,
          text: `${val.offerings[0].level}级`
        })
      }

      exploreInfo.world.push(tmp)
    }
    exploreInfo.homes = _.sample(res.data.homes)

    return await this.renderImg({ ...exploreInfo, uid: this.e.MysUid })
  }
}
