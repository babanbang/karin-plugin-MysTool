import { MysReq, MysUtil } from "@/mys"
import { Player } from "@/panel"
import { BingUIDType, ConfigName, GameList, MysUserDBCOLUMNS, UidWithType } from "@/types"
import { MysUser, User } from "@/user"
import { BaseModel, Cfg, GamePathType, getSimpleQrOption, SimpleQr, SimpleQrType } from "@/utils"
import { common, ImageElement, karin, KarinMessage, logger, segment } from "node-karin"
import { lodash } from "node-karin/modules.js"

interface uidInfo {
    key: GameList
    name: string
    uidList: (UidWithType & {
        name?: string
        level?: number
        face?: string
        banner?: string
    })[]
    banList: UidWithType[]
}

const reg = MysUtil.regs.join('|')
const getLtuidInfo = (mysUser: MysUser, option: { ck?: boolean, sk?: boolean } = {}) => {
    const msg = MysUtil.AllGames.map(game => {
        const uids = mysUser[MysUserDBCOLUMNS[game.key]]
        if (uids.length > 0) {
            return `【${game.name}】：${uids.join(', ')}`
        }
        return ''
    }).join('\n')

    return segment.text(msg + (option.ck ? `\n【CK】：${mysUser.cookie}` : '') + (option.sk ? `\n【SK】：${mysUser.stoken}` : ''))
}

const showUid = async (e: KarinMessage) => {
    const user = await User.create(e.user_id, GameList.Gs)

    if (MysUtil.games.length === 0) {
        e.reply('请查看插件README.md后安装额外组件后再查看！')
        return true
    }

    const uids: uidInfo[] = []
    MysUtil.eachGame((game, ds) => {
        const uidList = user.getUidList({ game, returnType: true })
        const uidInfo: uidInfo = {
            ...ds,
            uidList: [],
            banList: uidList.ban
        }
        uidList.list.forEach((v) => {
            const player = Player.create(v.uid, game)
            uidInfo.uidList.push({
                ...v, ...player.getData(['name', 'level', 'face', 'banner'])
            })
        })
        uids.push(uidInfo)
    })

    const base = new BaseModel(GamePathType.Core, e)
    base.model = 'user/uid-list'
    e.reply(await base.renderImg({ uids }))
    return true
}

/** 绑定米游社Cookie */
const bingCookie = async (e: KarinMessage, cookie?: string, mysUser?: MysUser, type: BingUIDType = BingUIDType.ck) => {
    if (!cookie) {
        e.reply('请发送#扫码登录', { at: true })
        return false
    }

    const cookieMap = MysUtil.getCookieMap(cookie)
    if (!cookieMap.cookie_token && !cookieMap.cookie_token_v2) {
        e.reply('发送Cookie不完整，请使用#扫码登录')
        return false
    }

    const ltuid = mysUser?.ltuid || cookieMap.ltuid || cookieMap.login_uid || cookieMap.ltuid_v2 || cookieMap.account_id_v2 || cookieMap.ltmid_v2
    if (!ltuid) {
        e.reply('发送Cookie不完整，请使用#扫码登录')
        return false
    }

    let CK: any = {
        ltoken: cookieMap.ltoken, ltuid, account_id: ltuid,
        cookie_token: cookieMap.cookie_token || cookieMap.cookie_token_v2
    }
    let flagV2 = false
    if (cookieMap.cookie_token_v2 && (cookieMap.account_mid_v2 || cookieMap.ltmid_v2)) { //
        // account_mid_v2 为版本必须带的字段，不带的话会一直提示绑定cookie失败 请重新登录
        flagV2 = true
        CK = {
            ltuid: CK.ltuid,
            account_mid_v2: cookieMap.account_mid_v2,
            cookie_token_v2: cookieMap.cookie_token_v2,
            ltoken_v2: cookieMap.ltoken_v2,
            ltmid_v2: cookieMap.ltmid_v2
        }
    }
    if (cookieMap.mi18nLang) {
        CK.mi18nLang = cookieMap.mi18nLang
    }
    if (!mysUser) mysUser = await MysUser.create(CK.ltuid)
    mysUser.cookie = MysUtil.splicToken(CK)

    /** 检查ck是否失效 */
    const uidRet = await mysUser.reqMysUid()
    if (uidRet.status !== 0) {
        logger.mark(`绑定Cookie错误1：${uidRet.msg || 'Cookie错误'}`)
        return e.reply(`绑定Cookie失败：${uidRet.msg || 'Cookie错误'}`)
    }

    // 判断data.ltuid是否正确
    if (flagV2 && isNaN(Number(mysUser.ltuid))) {
        // 获取米游社通行证id
        const mysReq = new MysReq({ cookie: mysUser.cookie, server: mysUser.type }, { log: false })
        const userFullInfo = await mysReq.getData('getUserFullInfo')
        if (userFullInfo?.data?.user_info) {
            const ltuid = userFullInfo.data.user_info.uid || mysUser.ltuid
            mysUser.setData({
                ltuid, cookie: MysUtil.splicToken({ ...CK, ltuid })
            })
        } else {
            logger.mark(`绑定Cookie错误2：${userFullInfo?.message || 'Cookie错误'}`)
            e.reply(`绑定Cookie失败：${userFullInfo?.message || 'Cookie错误'}`)
            return false

        }

        const user = await User.create(e.user_id, GameList.Gs)
        await user.addMysUser(mysUser, type)
        await mysUser.save()

        logger.mark(`${e.logFnc} 保存Cookie成功 [ltuid:${mysUser.ltuid}]`)

        e.reply(['绑定Cookie成功', getLtuidInfo(mysUser)].join('\n'))
        return true
    }
}

/** 绑定米游社Stoken */
const bingStoken = async (e: KarinMessage, stoken?: string) => {
    if (!stoken) {
        e.reply('请发送#扫码登录', { at: true })
        return false
    }

    const stokenMap = MysUtil.getCookieMap(stoken)
    if (!stokenMap.stoken || !stokenMap.stuid || !stokenMap.ltoken || !stokenMap.mid) {
        e.reply('发送Stoken不完整，请使用#扫码登录')
        return false
    }

    const mysUser = await MysUser.create(stokenMap.stuid)
    mysUser.setData({
        stoken: stokenMap.stoken,
        ltoken: stokenMap.ltoken,
        ltuid: stokenMap.stuid,
        mid: stokenMap.mid,
    })

    const cookie = await mysUser.updataCookie()
    if (!cookie) {
        e.reply('绑定Stoken失败，请#扫码登录')
        return false
    }

    const sendMsg = []
    const _reply = e.reply
    e.reply = (msg) => sendMsg.push(msg) as any

    await bingCookie(e, cookie, mysUser, BingUIDType.all)
    logger.mark(`${e.logFnc} 保存Stoken成功 [stuid:${mysUser.ltuid}]`)

    sendMsg.unshift('绑定Stoken成功', `米游社ID：${mysUser.ltuid}`)
    _reply(sendMsg.join('\n'))
    return true
}

/** 绑定UID */
export const BingUid = karin.command(
    new RegExp(`^(${reg})?绑定(uid)*(\\s|\\+)*((18|10|13|15|17|[1-9])[0-9]{8}|[1-9][0-9]{7})*$`, 'i'),
    async (e) => {
        const game = MysUtil.getGameByMsg(e.msg)
        let uid = MysUtil.matchUid(e.msg, game.key)
        if (!uid) {
            e.reply(`请发送要绑定的${game.name} UID！`)
            const _e = await karin.ctx(e, { replyMsg: `绑定${game.name} UID操作超时，已取消！` })
            uid = MysUtil.matchUid(_e.msg, game.key)
            if (!uid) {
                e.reply(`${game.name} UID错误，已取消绑定！`)
                return true
            }
        }

        const user = await User.create(e.user_id, game.key)
        user.addRegUid({ uid, save: true })

        await showUid(e)
        return true
    },
    { name: 'MysTool-绑定UID', priority: 0 }
)

/** 解绑UID */
export const DelBingUid = karin.command(
    new RegExp(`^(${reg})*(删除|解绑)uid(\\s|\\+)*([0-9]{1,2})*$`, 'i'),
    async (e) => {
        const game = MysUtil.getGameByMsg(e.msg)
        const idx = e.msg.match(/[0-9]{1,2}/g)
        if (idx && idx[0]) {
            const _idx = Number(idx[0])
            const user = await User.create(e.user_id, game.key)

            const uidList = user.getUidList()
            if (_idx > uidList.length) {
                e.reply('uid序号输入错误')
                return true
            }

            user.delRegUid(uidList[_idx - 1])
            await showUid(e)
        } else {
            e.reply(`删除uid请带上序号\n例如：#${game.key}删除uid1\n发送【#uid】可查看绑定的uid以及对应的序号`)
        }
        return true
    },
    { name: 'MysTool-解绑UID', priority: 0 }
)

/** 查询绑定的UID列表 */
export const ShowBingUidList = karin.command(
    new RegExp(`^(${reg})?(我的)?uid$`, 'i'),
    showUid,
    { name: 'MysTool-查询绑定UID列表', priority: 0 }
)

/** 发送cookie或stoken 绑定Cookie或Stoken */
export const BingCookieOrStokenByMsg = karin.command(
    /ltoken|ltoken_v2|ltuid|login_uid|ltmid_v2|stoken|stuid/i,
    async (e) => {
        if (/(ltoken|ltoken_v2)/.test(e.msg) && /(ltuid|login_uid|ltmid_v2)/.test(e.msg)) {
            if (e.isGroup) {
                e.reply('请私聊发送Cookie', { at: true })
                return true
            }
            await bingCookie(e, e.msg)
        } else if (/stoken/.test(e.msg) && /stuid/.test(e.msg)) {
            if (e.isGroup) {
                e.reply('请私聊发送Stoken', { at: true })
                return true
            }
            await bingStoken(e, e.msg)
        }

        return false
    },
    { name: 'MysTool-绑定Cookie或Stoken', priority: 0 }
)

/** 删除对应UID绑定的Cookie或Stoken */
export const DelCookieOrStoken = karin.command(
    new RegExp(`^#?(${reg})?删除(c(oo)?k(ie)?|s(to)?k(en)?)(\\s|\\+)*([0-9]{1,2})?$`, 'i'),
    async (e) => {
        const idx = e.msg.match(/[0-9]{1,2}/g)

        const game = MysUtil.getGameByMsg(e.msg)
        const user = await User.create(e.user_id, game.key)

        let uid = user.uid
        if (idx && idx[0]) {
            const _idx = Number(idx[0])
            const uidList = user.getUidList()
            if (_idx > uidList.length) {
                e.reply('序号输入错误')
                return true
            }
            uid = uidList[_idx - 1]
        }

        if (!uid) {
            e.reply('暂未绑定UID', { at: true })
            return true
        }

        const isCK = /c(oo)?k(ie)?/.test(e.msg)
        if (!user[isCK ? 'hasCk' : 'hasSk'](uid)) {
            e.reply(`UID:${uid}暂未绑定${isCK ? 'Cookie' : 'Stoke'}`, { at: true })
            return true
        }
        user.setUidType({ uid, type: BingUIDType[isCK ? 'ck' : 'sk'] })

        e.reply(`已删除UID:${uid}绑定的${isCK ? 'Cookie' : 'Stoke'}`, { at: true })
        return true
    },
    { name: 'MysTool-删除Cookie或Stoken', priority: 0 }
)

/** 查询绑定的Cookie和Stoken */
export const ShowMyCookieAndStoken = karin.command(
    new RegExp(`^#?(${reg})?我的(c(oo)?k(ie)?|s(to)?k(en)?)$`, 'i'),
    async (e) => {
        if (e.isGroup) {
            e.reply('请私聊查看', { at: true })
            return true
        }

        const user = await User.create(e.user_id, GameList.Gs)
        const mysUsers = user.getAllMysUser()
        if (mysUsers.length === 0) {
            e.reply('尚未绑定米游社账号', { at: true })
            return true
        }

        const sendMsg = mysUsers.map(mysUser => {
            return getLtuidInfo(mysUser, { ck: true, sk: true })
        })

        const content = common.makeForward(sendMsg, e.self_id, e.bot.account.name)
        e.bot.sendForwardMessage(e.contact, content)
        return true
    },
    { name: 'MysTool-查询绑定Cookie或Stoken', priority: 0 }
)

const QRCodes: Map<string, ImageElement | true> = new Map()
/** 扫码登录绑定UID、Cookie、Stoken */
export const MiHoYoLoginQRCode = karin.command(
    new RegExp(`^(${reg})*(扫码|二维码|辅助)(登录|绑定|登陆)$`, 'i'),
    async (e) => {
        const qrcode = QRCodes.get(e.user_id)
        if (qrcode) {
            if (qrcode === true) return true

            e.reply(['请使用米游社扫码登录', qrcode
            ], { at: true, recallMsg: 60 })
            return true
        }
        QRCodes.set(e.user_id, true)

        const device = MysUtil.randomString(64)
        const mysReq = new MysReq({ user_id: e.user_id }, { log: false })

        const QRcode = await mysReq.getData('fetchQRcode', { device })
        if (!QRcode?.data?.url) {
            QRCodes.delete(e.user_id)
            e.reply('获取二维码失败、请稍后再试', { at: true })
            return true
        }

        const base = new BaseModel(GamePathType.Core, e)
        base.model = 'user/login-qrcode'

        const config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
        let qrbtf; let style: SimpleQrType = SimpleQrType.base
        if (config?.qrbtf) {
            const qr = Cfg.getConfig(ConfigName.qrbtf, GamePathType.Core)
            const option = lodash.sample(qr.styles)
            if (option?.style && SimpleQr[option.style]) {
                style = option.style
                qrbtf = getSimpleQrOption(option.style, QRcode.data.url, option)
            }
        }
        if (!qrbtf) {
            qrbtf = getSimpleQrOption(SimpleQrType.base, QRcode.data.url, { style: SimpleQrType.base })
        }
        const image = await base.renderImg({
            QRSVGS: [SimpleQr[style](qrbtf)]
        }, { nowk: true })
        if (!image) {
            QRCodes.delete(e.user_id)
            e.reply('生成二维码失败、请稍后再试', { at: true })
            return true
        }
        QRCodes.set(e.user_id, image)
        e.reply(['请使用米游社扫码登录', image], { at: true, recallMsg: 60 })

        let data
        let Scanned
        const ticket = QRcode.data.url.split('ticket=')[1]
        for (let n = 1; n < 60; n++) {
            await common.sleep(5000)
            try {
                const res = await mysReq.getData('queryQRcode', { device, ticket })
                if (!res) continue

                if (res.retcode === 3503) {
                    e.reply(res.message, { at: true, recallMsg: 60 })
                    QRCodes.delete(e.user_id)
                    return true
                }

                if (res.retcode !== 0) {
                    e.reply('二维码已过期，请重新登录', { at: true, recallMsg: 60 })
                    QRCodes.delete(e.user_id)
                    return true
                }

                if (res.data.stat === 'Scanned' && !Scanned) {
                    Scanned = true
                    QRCodes.set(e.user_id, true)
                    e.reply('二维码已扫描，请确认登录', { at: true, recallMsg: 60 })
                }

                if (res.data.stat === 'Confirmed') {
                    data = JSON.parse(res.data.payload.raw)
                    break
                }
            } catch (err) {
                logger.error(`[扫码登录] 错误：${logger.red(err as string)}`)
            }
        }
        if (!data.uid && !data.token) {
            e.reply('登录失败', { at: true })
            QRCodes.delete(e.user_id)
            return false
        }

        const res = await mysReq.getData('getTokenByGameToken', data)
        if (!res) {
            e.reply('获取Token失败', { at: true })
            QRCodes.delete(e.user_id)
            return false
        }
        const stoken = `stoken=${res.data.token.token};stuid=${res.data.user_info.aid};mid=${res.data.user_info.mid};`

        await bingStoken(e, stoken)
        QRCodes.delete(e.user_id)
        return true
    },
    { name: 'MysTool-米游社登录二维码', priority: 0 }
)

/** 刷新米游社Cookie */
export const UpdataCookie = karin.command(
    new RegExp(`^(${reg})*(刷新|更新)c(oo)?k(ie)?$`, 'i'),
    async (e) => {
        const user = await User.create(e.user_id, GameList.Gs)

        const sendMsg: any[] = []
        const _reply = e.reply
        e.reply = (msg) => sendMsg.push(msg) as any

        for (const stuid of user.stuids) {
            const mys = user.mysUsers[stuid]
            if (!mys) continue

            const cookie = await mys.updataCookie()
            if (!cookie) {
                e.reply([getLtuidInfo(mys), 'stoken已失效，请重新绑定'].join('\n'))
                continue
            }
            await bingCookie(e, cookie, mys, BingUIDType.all)
        }

        const content = common.makeForward(sendMsg, e.self_id, e.bot.account.name)
        e.bot.sendForwardMessage(e.contact, content)
        return true
    },
    { name: 'MysTool-刷新米游社Cookie', priority: 0 }
)