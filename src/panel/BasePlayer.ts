import { GameList } from "@/types";
import { BasePanel } from "./BasePanel";
import { Data, GamePathType, karinPath } from "@/utils";

export class BasePlayer extends BasePanel {
    /** 查询UID */
    uid: string
    /** 昵称 */
    name: string = ''
    /** 等级 */
    level: number = 0
    /** 头像 */
    face: string = ''
    /** 背景图 */
    card: string = ''
    _updateAvatar: string[] = []

    constructor(uid: string, game: GameList) {
        super(game)
        this.uid = uid
    }

    get banner() {
        const imgPath = Data.getFilePath(`resources/images/other/default_banner.png`, GamePathType[this.game], karinPath.node)
        if (!imgPath) return Data.getFilePath(`resources/images/other/default_banner.png`, GamePathType.Core, karinPath.node)
        return imgPath
    }

    get PlayerDataPath() {
        return `PlayerData/${this.uid}.json`
    }

    static create(uid: string, game: GameList) {
        const player = new BasePlayer(uid, game)
        const cache = player._getCache(`player:${game}:${uid}`)
        if (cache) return cache

        player.reload()
        return player._cache(100)
    }

    /** 加载面板数据文件 */
    reload() {
        const data = Data.readJSON(this.PlayerDataPath, GamePathType[this.game], karinPath.data, {})
        this.setBasicData(data)
    }

    /** 保存面板数据 */
    save(saveData: any) {
        Data.writeJSON(this.PlayerDataPath, saveData, GamePathType[this.game], karinPath.data)
        this._delCache()
    }

    /** 设置基础数据 */
    setBasicData(ds: {
        name?: string
        level?: number
        face?: string
        card?: string
    }, save = false) {
        this.name = ds.name || this.name
        this.level = ds.level || this.level
        this.face = ds.face || this.face
        this.card = ds.card || this.card

        save && this.save(this.getData(['name', 'level', 'face', 'card']))
    }
}