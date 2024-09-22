import { ConfigName, ConfigsType } from "@/types";
import { KarinMessage, karin, segment } from "node-karin";
import path from "path";
import { Data, GamePathType, karinPath } from "./Data";
import { Cfg } from "./config";
import { NpmPath, PluginName, isNpm } from "./dir";
// import { wkhtmltoimage } from "./wkhtmltoimage";

const res_Path = path.join(NpmPath, 'resources/').replace(/\\/g, '/')
const fontsPath = path.join(NpmPath, 'resources/fonts/').replace(/\\/g, '/')
const defaultLayout = path.join(NpmPath, 'resources/template/layout/default.html').replace(/\\/g, '/')

export class BaseModel<g extends GamePathType>{
	/** 查询UID */
	uid?: string
	e?: KarinMessage
	game: g
	model: string
	NpmPath: string
	PluginName: string
	config: ConfigsType<ConfigName.config, GamePathType.Core>
	constructor(game: g, e?: KarinMessage) {
		this.e = e
		this.game = game

		this.model = PluginName
		this.NpmPath = Data.getNpmPath(this.game)
		this.PluginName = Data.getPluginName(this.game, isNpm)

		this.config = Cfg.getConfig(ConfigName.config, GamePathType.Core)
	}

	get redisPrefix() {
		return PluginName + ':' + this.game + ':'
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
			game: this.game,
			name: this.PluginName + '/' + this.model,
			quality: this.config.quality || 100,
			fileID: data.uid || this.uid || this.e?.user_id || this.model,
			file: path.join(this.NpmPath, `resources/template/${this.model}.html`),
			data: {
				uid: this.uid,
				PluginName: this.PluginName,
				PluginVersion: Cfg.package(this.game).version,
				MysToolVersion: this.game === GamePathType.Core ? false : Cfg.package(GamePathType.Core).version,
				pluResPath: path.join(this.NpmPath, 'resources/').replace(/\\/g, '/'),
				fontsPath, res_Path, defaultLayout,
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

		// let img
		// if (!options.nowk && this.config.wkhtmltoimage) {
		// 	img = await wkhtmltoimage(ImageData)
		// }
		// if (!img) {
		// 	img = await karin.render(ImageData)
		// }

		const img = await karin.render(ImageData)
		return segment.image(img)
	}
}