import { ConfigName, GameList, ConfigsType } from "@/types";
import { KarinMessage, karin, segment } from "node-karin";
import { PluginName, dirPath } from "./dir";
import { Cfg } from "./config";
import { GamePathType, karinPath } from "./Data";
import { Data } from "./Data";
import { wkhtmltoimage } from "./wkhtmltoimage";

export class BaseModel {
    /** 查询UID */
    uid?: string
    e?: KarinMessage
    game: GamePathType
    model: string
    PluginName: string
    config: ConfigsType<ConfigName.config, GamePathType.Core>
    constructor(game: GamePathType, e?: KarinMessage) {
        this.e = e
        this.game = game
        this.model = PluginName
        this.PluginName = Data.getGamePath(this.game)
        this.config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
    }

    get redisPrefix() {
        return PluginName + ':' + this.game + ':'
    }

    get ModelName() {
        return this.PluginName + this.model
    }

    async renderImg(data: any, options: {
        nowk?: boolean
        test?: boolean
        Scale?: boolean
        wait?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
    } = {}) {
        if (options.test) {
            if (data) {
                Data.writeJSON(`template/${this.model}/data.json`, data, this.game, karinPath.temp)
            }
            data = Data.readJSON(`template/${this.model}/${this.game}/data.json`, this.game, karinPath.temp)
        }
        const ImageData = {
            name: this.ModelName,
            fileID: data.uid || this.uid || this.e?.user_id || this.model,
            file: `./node_modules/${Data.getGamePath(this.game, true)}resources/template/${this.model}.html`,
            quality: this.config.quality || 100,
            data: {
                uid: this.uid,
                useBrowser: '-pu',
                fontsPath: `${dirPath}/resources/fonts/`,
                pluResPath: `${Data.getFilePath('resources/', this.game, karinPath.node)}/`,
                res_Path: `${dirPath}/resources/`,
                elemLayout: `${dirPath}/resources/template/layout/elem.html`,
                defaultLayout: `${dirPath}/resources/template/layout/default.html`,
                PluginName: this.PluginName,
                ...data
            },
            // setViewport: {
            //   deviceScaleFactor: 1
            // }
        }
        if (options.wait) {
            ImageData.data.pageGotoParams = {
                waitUntil: options.wait
            }
        }
        // if (options.Scale) ImageData.quality = 40

        let img
        if (!options.nowk && this.config.wkhtmltoimage) {
            img = await wkhtmltoimage(ImageData)
        }
        if (!img) {
            img = await karin.render(ImageData)
        }
        return segment.image(img)
    }
}