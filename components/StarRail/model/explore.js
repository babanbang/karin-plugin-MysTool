import { Base, Cfg, Data } from '#Mys.tool'
import { MysInfo, MysUtil } from '#Mys.api'
import { Player } from '#Mys.rank'
import _ from 'lodash'

const buff = Data.readJSON('/components/StarRail/resources/imgs/challenge/buff.json')
export default class Explore extends Base {
  constructor (e) {
    super(e, 'sr')
    this.model = 'explore/explore'
    this.lable = Cfg.getdefSet('lable', 'sr')
  }

  async get () {
    const res = await MysInfo.get(this.e, [
      ['index'], ['rogue', { detail: false }],
      ['challenge', { need_all: false, schedule_type: 1 }]
    ])

    if (_.every(res, v => v?.retcode !== 0)) {
      return false
    }
    const [index, rogue, challenge] = res

    const exploreInfo = { version: this.lable.version }
    exploreInfo.role = {
      ...rogue.data.role,
      region: MysUtil.ServerToRegion(rogue.data.role.server)
    }
    const player = new Player(this.e.MysUid, 'gs')
    player.setBasicData({ ...rogue.data.role, face: index.cur_head_icon_url }, true)

    exploreInfo.avatars = index.data.avatar_list.filter(i => i.is_chosen)
    if (exploreInfo.avatars.length < 8) {
      exploreInfo.avatars = index.data.avatar_list.splice(0, 8)
    }

    const stats = index.data.stats
    exploreInfo.explores = {
      line: [
        { lable: '活跃天数', num: stats.active_days, extra: Math.floor((new Date() - new Date('2023-04-26')) / (1000 * 60 * 60 * 24)) + 1 },
        { lable: '已解锁角色', num: stats.avatar_num, extra: this.lable.avatar }
      ],
      other: [
        { lable: '达成成就数', num: stats.achievement_num, extra: this.lable.achievement },
        { lable: '战利品开启', num: stats.chest_num, extra: this.lable.chest },
        { lable: '逐光捡金', num: stats.abyss_process },
        { lable: '梦境护照贴纸', num: stats.dream_paster_num, extra: this.lable.dream_paster }
      ]
    }

    const basic = rogue.data.basic_info
    exploreInfo.rogue = {
      basic_info: [
        { lable: '技能树已激活', num: basic.unlocked_skill_points, extra: this.lable.unlocked_skill },
        { lable: '已解锁奇物', num: basic.unlocked_miracle_num, extra: this.lable.unlocked_miracle },
        { lable: '已解锁祝福', num: basic.unlocked_buff_num, extra: this.lable.unlocked_buff }
      ],
      current: {
        time: this.dealTime(rogue.data.current_record.basic, ['schedule_begin', 'schedule_end']),
        ...rogue.data.current_record.basic
      }
    }

    exploreInfo.challenge = {
      time: this.getTime(challenge.data.end_time),
      name: (challenge.data.groups.find(v => v.schedule_id === challenge.data.schedule_id)).name_mi18n,
      ...challenge.data,
      buff: buff[challenge.data.schedule_id].replace(/\${([^}]*)}/g, '<span style="color: chocolate;">$1</span>')
    }
    if (challenge.data.has_data) {
      const floor = challenge.data.all_floor_detail.find(v => v.name === challenge.data.max_floor)
      for (const i of ['node_1', 'node_2']) {
        exploreInfo.challenge[i] = {
          ...floor[i],
          time: this.deal(floor[i].challenge_time)
        }
      }
      exploreInfo.challenge.round_num = floor.round_num
      exploreInfo.challenge.max_floor_star = floor.star_num
    }

    exploreInfo.background_url = index.data.phone_background_image_url
    exploreInfo.game_head_icon = index.data.cur_head_icon_url

    return await this.renderImg({ ...exploreInfo, uid: this.e.MysUid })
  }

  dealTime (basic, type) {
    const result = []
    for (const k of type) {
      result.push(this.deal(basic[k]))
    }

    return result.join(' -- ')
  }

  deal (data, format = false) {
    const dateValues = ['year', 'month', 'day'].map(key =>
      (['month', 'day'].includes(key) && data[key] < 10) ? '0' + data[key] : data[key]
    ).join('.')
    const timeValues = ['hour', 'minute', 'second'].map(key =>
      data[key] < 10 ? '0' + data[key] : data[key]
    ).join(':').replace(/:$/, '')
    if (format) return `${dateValues.replace(/\./g, '-')}T${timeValues}:00`
    return `${dateValues} ${timeValues}`
  }

  getTime (data) {
    const futureDate = new Date(this.deal(data, true))

    const diff = futureDate - new Date()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${days > 0 ? `${days}天` : ''}${hours}小时${days > 0 ? '' : `${minutes}分钟`}`
  }
}
