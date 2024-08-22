import { GameKeyAndName, GameList, GameNames, GameRegion, MysType } from '@/types/mys'
import lodash from 'node-karin/lodash'
import moment from 'node-karin/moment'
import { game_biz, game_servers } from './MysTool'

export const MysUtil = new (class Mysutil {
    #all_game_biz = Object.values(game_biz).flat()
    #gamelist: GameKeyAndName[] = []
    #allgames: GameKeyAndName[] = [
        { key: GameList.Gs, name: GameNames.gs },
        { key: GameList.Sr, name: GameNames.sr },
        { key: GameList.Zzz, name: GameNames.zzz }
    ]
    #allReg = {
        [GameList.Sr]: '(\\*|#?(sr|星铁|星轨|穹轨|星穹|崩铁|星穹铁道|崩坏星穹铁道|铁道))',
        [GameList.Zzz]: '(%|#?(zzz|绝区零))',
        [GameList.Gs]: '#?(gs|原神)'
    }

    get reg() {
        return { ...this.#allReg }
    }
    get regs() {
        return this.games.map(g => this.reg[g.key])
    }
    get servs() {
        return [MysType.cn, MysType.os]
    }
    get games() {
        return [...this.#gamelist]
    }
    get AllGames() {
        return [...this.#allgames]
    }
    get AllGameBiz() {
        return [...this.#all_game_biz]
    }
    get EndOfDay() {
        return Number(moment().endOf('day').format('X')) - Number(moment().format('X'))
    }

    initGame(key: GameList) {
        if (this.#gamelist.some((g) => g.key === key)) return
        this.#gamelist.push({ key, name: GameNames[key] })
        this.#gamelist = lodash.sortBy(this.#gamelist, 'key')
    }

    getGame(game: GameList) {
        return this.games.find((g) => g.key === game)!
    }

    getGameByMsg(msg: string) {
        for (const i in this.reg) {
            const game = i as GameList
            if (new RegExp('^' + this.reg[game]).test(msg)) {
                return this.games.find((g) => g.key === i)!
            }
        }

        return this.#allgames[2]
    }

    getServ(uid: string, game: GameList) {
        return (game === GameList.Zzz ? /^(10|13|15|17)[0-9]{8}/i : /^(18|[6-9])[0-9]{8}/i).test(uid) ? this.servs[1] : this.servs[0]
    }

    getGamebiz(game: GameList, os = false) {
        return game_biz[game][os ? 1 : 0]
    }

    getGameByGamebiz(biz: string) {
        for (const i in game_biz) {
            const game = i as GameList
            if (game_biz[game].includes(biz)) {
                return this.#allgames.find((g) => g.key === game)!
            }
        }
        return this.#allgames[2]
    }

    getGameByRegion(region: string) {
        for (const i in game_servers) {
            const game = i as GameList
            if (game_servers[game].some(r => r.region === region)) {
                return this.#allgames.find((g) => g.key === game)!
            }
        }
        return this.#allgames[2]
    }

    getServerByRegion<g extends GameList>(region: GameRegion<g>, game: g) {
        return game_servers[game].find(r => r.region === region)!
    }

    getServerByUid(uid: string, game: GameList) {
        if (game === GameList.Zzz) {
            if (uid.length < 10) {
                return game_servers[GameList.Zzz][0] // 官服
            }

            switch (uid.slice(0, -8)) {
                case '10':
                    return game_servers[GameList.Zzz][2] // 美服
                case '15':
                    return game_servers[GameList.Zzz][3] // 欧服
                case '13':
                    return game_servers[GameList.Zzz][4] // 亚服
                case '17':
                    return game_servers[GameList.Zzz][5] // 港澳台服
            }
        } else {
            switch (uid.slice(0, -8)) {
                case '5':
                    return game_servers[game][1] // B服
                case '6':
                    return game_servers[game][2] // 美服
                case '7':
                    return game_servers[game][3] // 欧服
                case '8':
                case '18':
                    return game_servers[game][4] // 亚服
                case '9':
                    return game_servers[game][5] // 港澳台服
            }
        }
        return game_servers[game][0] // 官服
    }

    getCookieMap(cookie: string) {
        const cookieArray = cookie.replace(/#|'|"/g, '').replace(/\s*/g, '').split(';')
        const cookieMap: Record<string, string> = {}
        for (let item of cookieArray) {
            const entry = item.replace('=', '~').split('~')
            if (!entry[0]) continue
            cookieMap[entry[0]] = entry[1] || ''
        }
        return cookieMap
    }

    splicToken(token: any) {
        return Object.entries(token).filter(([k, v]) => v).map(([k, v]) => `${k}=${v}`).join(';') + ';'
    }

    randomString(n: number) {
        return lodash.sampleSize('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', n).join('')
    }

    isHoyolab(region: string, game: GameList) {
        return region === MysType.os || game_servers[game].find((r) => r.region === region)!.os
    }

    matchUid(msg: string, game: GameList) {
        const uid = msg.match(game === GameList.Zzz ? /((10|13|15|17)[0-9]{8}|[1-9][0-9]{7})/g : /((18|[1-9])[0-9]{8})/g)
        if (!uid?.[0] || uid.length > 1) return false
        return uid[0]
    }

    /** 循环game */
    async eachGame(fn: (game: GameList, ds: GameKeyAndName) => any, all = false) {
        for (const ds of (all ? this.#allgames : this.games)) {
            await fn(ds.key, ds)
        }
    }

    /** 生成设备guid */
    getDeviceGuid() {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
        }

        return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
    }

    getSeedId(n: number) {
        return lodash.sampleSize('0123456789abcdef', n)
    }

    getEndOfDay() {
        return Number(moment().endOf('day').format('X')) - Number(moment().format('X'))
    }

    checkMonth(year: number, month: number, num = 2) {
        month -= 1

        const nowDate = new Date()
        let nowYear = nowDate.getFullYear()
        let nowMonth = nowDate.getMonth()

        nowDate.setMonth(nowDate.getMonth() - num)
        let twoMonthsAgoYear = nowDate.getFullYear()
        let twoMonthsAgoMonth = nowDate.getMonth()

        if (year > twoMonthsAgoYear || (year === twoMonthsAgoYear && month >= twoMonthsAgoMonth)) {
            if (year < nowYear || (year === nowYear && month <= nowMonth)) {
                return true
            }
        }
        return false
    }
})