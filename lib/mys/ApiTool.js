import MysTool from './MysTool.js'

export default class ApiTool {
  constructor (uid, server, game = 'gs') {
    this.uid = uid
    this.server = server
    this.game = game
    this.game_biz = MysTool.game_biz[game][0]
  }

  getUrlMap (data = {}) {
    if (['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn', 'mys'].includes(this.server)) {
      return this.MiYouSheUrlMap(data)
    } else {
      return this.HoYoLabUrlMap(data)
    }
  }

  MiYouSheUrlMap (data) {
    const urlMap = {
      gs: {
        /** 首页宝箱 */
        index: {
          url: `${MysTool.record_api}game_record/app/genshin/api/index`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 角色详情 */
        character: {
          url: `${MysTool.record_api}game_record/app/genshin/api/character`,
          body: { role_id: this.uid, server: this.server }
        },
        /** 深渊 */
        spiralAbyss: {
          url: `${MysTool.record_api}game_record/app/genshin/api/spiralAbyss`,
          query: `role_id=${this.uid}&schedule_type=${data.schedule_type || 1}&server=${this.server}`
        },
        /** 树脂 */
        dailyNote: {
          url: `${MysTool.record_api}game_record/app/genshin/api/dailyNote`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 小组件 */
        widget: {
          url: `${MysTool.record_api}game_record/genshin/aapi/widget/v2`,
          types: 'widget'
        },
        /** 详情 */
        detail: {
          url: `${MysTool.web_api}event/e20200928calculate/v1/sync/avatar/detail`,
          query: `uid=${this.uid}&region=${this.server}&avatar_id=${data.avatar_id}`
        },
        /** 札记 */
        ledger: {
          url: `${MysTool.hk4_api}event/ys_ledger/monthInfo`,
          query: `month=${data.month}&bind_uid=${this.uid}&bind_region=${this.server}`
        },
        /** 养成计算器 */
        compute: {
          url: `${MysTool.web_api}event/e20200928calculate/v2/compute`,
          body: data.body
        },
        blueprintCompute: {
          url: `${MysTool.web_api}event/e20200928calculate/v1/furniture/compute`,
          body: data.body
        },
        /** 养成计算器 */
        blueprint: {
          url: `${MysTool.web_api}event/e20200928calculate/v1/furniture/blueprint`,
          query: `share_code=${data.share_code}&region=${this.server}`
        },
        /** 角色技能 */
        avatarSkill: {
          url: `${MysTool.web_api}event/e20200928calculate/v1/avatarSkill/list`,
          query: `avatar_id=${data.avatar_id}`
        },
        /** 七圣召唤数据 */
        basicInfo: {
          url: `${MysTool.record_api}game_record/app/genshin/api/gcg/basicInfo`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 七圣牌组 */
        deckList: {
          url: `${MysTool.record_api}game_record/app/genshin/api/gcg/deckList`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 七圣召唤角色牌、行动牌数据 */
        cardList: {
          url: `${MysTool.record_api}game_record/app/genshin/api/gcg/cardList`,
          query: `limit=999&need_action=${data.need_action}&need_avatar=true&need_stats=true&offset=0&role_id=${this.uid}&server=${this.server}`
        }
      },
      sr: {
        /** 首页宝箱 */
        index: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/index`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 角色详情 */
        character: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/avatar/info`,
          query: `need_wiki=true&role_id=${this.uid}&server=${this.server}`
        },
        basicInfo: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/role/basicInfo`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 混沌回忆 */
        spiralAbyss: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/challenge`,
          query: `role_id=${this.uid}&schedule_type=${data.schedule_type || 1}&server=${this.server}`
        },
        avatarInfo: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/avatar/info`,
          query: `need_wiki=true&role_id=${this.uid}&server=${this.server}`
        },
        /** 开拓阅历接口 */
        ledger: {
          url: `${MysTool.web_api}event/srledger/month_info`,
          query: `region=${this.server}&uid=${this.uid}&month=${data.month}`
        },
        /** 树脂 */
        dailyNote: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/note`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        /** 养成计算器 */
        compute: {
          url: `${MysTool.web_api}event/rpgcalc/compute?`,
          query: 'game=hkrpg',
          body: data.body
        },
        /** 详情 */
        detail: {
          url: `${MysTool.web_api}event/rpgcalc/avatar/detail`,
          query: `game=hkrpg&lang=zh-cn&item_id=${data.avatar_id}&tab_from=${data.tab_from}&change_target_level=0&uid=${this.uid}&region=${this.server}`
        },
        /** 模拟宇宙 */
        rogue: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/rogue`,
          query: `need_detail=${data.detail}&role_id=${this.uid}&schedule_type=3&server=${this.server}`
        },
        /** 忘却之庭 */
        challenge: {
          url: `${MysTool.record_api}game_record/app/hkrpg/api/challenge`,
          query: `${data.need_all ? 'isPrev=true&need_all=true&' : ''}role_id=${this.uid}&schedule_type=${data.schedule_type}&server=${this.server}`
        }
      },
      zzz: {}
    }

    const otherUrlMap = {
      UserGame: {
        url: `${MysTool.web_api}binding/api/getUserGameRolesByCookie`,
        query: `game_biz=${this.game_biz}`
      },
      getLtoken: {
        url: `${MysTool.pass_api}account/auth/api/getLTokenBySToken`,
        query: `${data.cookies}`,
        HeaderType: 'noHeader'
      },
      getTokenByGameToken: {
        url: `${MysTool.pass_api}account/ma-cn-session/app/getTokenByGameToken`,
        body: { account_id: parseInt(data.uid), game_token: data.token },
        HeaderType: 'passport'
      },
      getCookieBySToken: {
        url: `${MysTool.web_api}auth/api/getCookieAccountInfoBySToken`,
        query: `game_biz=hk4e_cn&${data.cookies}`,
        HeaderType: 'noHeader'
      },
      getUserGameRolesByCookie: {
        url: `${MysTool.web_api}binding/api/getUserGameRolesByCookie`
      },
      getUserGameRolesByStoken: {
        url: `${MysTool.new_web_api}binding/api/getUserGameRolesByStoken`,
        types: 'widget'
      },
      getActionTicket: {
        url: `${MysTool.new_web_api}auth/api/getActionTicketBySToken`,
        query: `uid=${data.ltuid}&action_type=game_role`,
        types: 'widget'
      },
      changeGameRole: {
        url: `${MysTool.new_web_api}binding/api/changeGameRoleByDefault`,
        body: {
          action_ticket: data.action_ticket,
          game_biz: data.game_biz,
          game_uid: data.game_uid,
          region: data.region,
          t: Math.round(new Date().getTime() / 1000)
        },
        trpes: 'role'
      },
      getUserFullInfo: {
        url: `${MysTool.web_api}user/wapi/getUserFullInfo`,
        query: 'gids=2',
        HeaderType: 'FullInfo'
      },
      getFp: {
        url: `${MysTool.public_data_api}device-fp/api/getFp`,
        body: {
          seed_id: data.seed_id,
          device_id: data.deviceId?.toUpperCase(),
          platform: '1',
          seed_time: new Date().getTime() + '',
          ext_fields: `{"proxyStatus":"0","accelerometer":"-0.159515x-0.830887x-0.682495","ramCapacity":"3746","IDFV":"${data.deviceId?.toUpperCase()}","gyroscope":"-0.191951x-0.112927x0.632637","isJailBreak":"0","model":"iPhone12,5","ramRemain":"115","chargeStatus":"1","networkType":"WIFI","vendor":"--","osVersion":"17.0.2","batteryStatus":"50","screenSize":"414×896","cpuCores":"6","appMemory":"55","romCapacity":"488153","romRemain":"157348","cpuType":"CPU_TYPE_ARM64","magnetometer":"-84.426331x-89.708435x-37.117889"}`,
          app_name: 'bbs_cn',
          device_fp: '38d7ee834d1e9'
        }
      },
      fetchQRcode: {
        url: `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/fetch`,
        body: { app_id: MysTool.app_id, device: data.device },
        HeaderType: 'noHeader'
      },
      queryQRcode: {
        url: `${MysTool.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/query`,
        body: { app_id: MysTool.app_id, device: data.device, ticket: data.ticket },
        HeaderType: 'noHeader'
      }
    }
    return { ...urlMap[this.game], ...otherUrlMap }
  }

  HoYoLabUrlMap (data) {
    const urlMap = {
      gs: {},
      sr: {},
      zzz: {}
    }
    const otherUrlMap = {
      getCookieBySToken: {
        url: `${MysTool.os_web_api}auth/api/getCookieAccountInfoBySToken`,
        query: `game_biz=hk4e_global&${data.cookies}`,
        HeaderType: 'noHeader'
      },
      getUserGameRolesByCookie: {
        url: `${MysTool.os_web_api}binding/api/getUserGameRolesByCookie`
      }
    }
    return { ...urlMap[this.game], ...otherUrlMap }
  }
}
