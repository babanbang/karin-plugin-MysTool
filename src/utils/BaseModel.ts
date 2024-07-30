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
        return Data.getGamePath(this.game) + this.model
    }

    async renderImg(data: any, options: {
        nowk?: boolean
        test?: boolean
        Scale?: boolean
        wait?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
    } = {}) {
        if (data && options.test) {
            Data.writeJSON(`template/${this.model}/${this.game}/data.json`, data, { k: karinPath.data })
        }
        const ImageData = {
            name: this.ModelName,
            fileID: data.uid || this.uid || this.e?.user_id || this.model,
            file: `./plugins/${Data.getGamePath(this.game)}resources/template/${this.model}.html`,
            quality: this.config.quality || 100,
            data: {
                uid: this.uid,
                useBrowser: '-pu',
                fontsPath: `${dirPath}/resources/fonts/`,
                pluResPath: `${Data.getFilePath(`-${Data.getGamePath(this.game, true)}resources`, { k: karinPath.plugins })}/`,
                res_Path: `${dirPath}/resources/`,
                elemLayout: `${dirPath}/resources/template/layout/elem.html`,
                defaultLayout: `${dirPath}/resources/template/layout/default.html`,
                PluginName: this.PluginName,
                ...((!data && options.test)
                    ? Data.readJSON(`template/${this.model}/${this.game}/data.json`, { k: karinPath.data })
                    : data)
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