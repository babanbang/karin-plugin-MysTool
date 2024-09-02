import { GamePathType } from "@/utils";
import { Dialect } from "sequelize";

export const enum ConfigName {
	/** 基础配置 */
	config = 'config',
	/** 面板配置 */
	panel = 'panel',
	/** 游戏基础数据配置 */
	lables = 'lables'
}

export const enum CfgType {
	config = 'config',
	defSet = 'defSet'
}

interface CoreConfig {
	/** 查询时是否只使用自己绑定的CK */
	onlySelfCk: boolean
	/** 米游社国际服代理 */
	proxy: {
		/** 代理地址 */
		host: string
		/** 代理端口 */
		port: number
	}

	/** 使用wkhtmltoimage渲染图片 */
	wkhtmltoimage: false

	/** 渲染精度(0 - 100) */
	quality: number

	/**  数据库（可选sqlite、postgres）一般使用sqlite就足够满足需求*/
	dialect: ('sqlite' | 'postgres') & Dialect

	/**  PostgreSQL 数据库默认配置 */
	postgres: {
		/** 数据库地址 */
		host?: string
		/** 数据库端口 */
		port?: number
		/** 数据库名称 */
		database?: string
		/** 数据库用户名 */
		username?: string
		/** 数据库密码 */
		password?: string
	}
}

interface Panel {
	/** 面板查询服务 */
	serv: string
}

interface Lable {
	/** 当前版本 */
	version: number
	/** 总成就数 */
	achievement: number
	/** 总角色数 */
	avatar: number
	/** 最高等级 */
	level: number
}

interface GsLables extends Lable {
	/** 奇馈宝箱 */
	magic_chest: number
	/** 华丽宝箱 */
	luxurious_chest: number
	/** 珍贵宝箱 */
	precious_chest: number
	/** 精致宝箱 */
	exquisite_chest: number
	/** 普通宝箱 */
	common_chest: number
	/**  传送点 */
	way_point: number
	/** 秘境 */
	domain: number
	/**   风神瞳 */
	anemoculus: number
	/** 岩神瞳 */
	geoculus: number
	/** 雷神瞳 */
	electroculus: number
	/** 草神瞳 */
	dendroculus: number
	/** 水神瞳 */
	hydroculus: number
}

interface SrPanel extends Panel {
	/** 使用米游社API查询面板数据 */
	MysApi: boolean
}

interface SrLables extends Lable {
	/**  战利品 */
	chest: number
	/** 梦境护照贴纸 */
	dream_paster: number
	/** 模拟宇宙技能树激活 */
	unlocked_skill: number
	/** 模拟宇宙解锁奇物 */
	unlocked_miracle: number
	/** 模拟宇宙解锁祝福 */
	unlocked_buff: number
	/** 差分宇宙总结点 */
	skill_tree: number
	/** 寰宇蝗灾行者之道 */
	locust_narrow: number
	/** 寰宇蝗灾已解锁奇物 */
	locust_miracle: number
	/** 寰宇蝗灾已解锁事件 */
	locust_event: number
}

interface ZzzLable {
	/**  总邦布数 */
	buddy: number
}

type Configs = {
	[ConfigName.config]: {
		[GamePathType.Core]: CoreConfig
		[GamePathType.Sign]: undefined
		[GamePathType.gs]: undefined
		[GamePathType.sr]: undefined
		[GamePathType.zzz]: undefined
	}
	[ConfigName.panel]: {
		[GamePathType.Core]: undefined
		[GamePathType.Sign]: undefined
		[GamePathType.gs]: Panel
		[GamePathType.sr]: SrPanel
		[GamePathType.zzz]: undefined
	}
	[ConfigName.lables]: {
		[GamePathType.Core]: undefined
		[GamePathType.Sign]: undefined
		[GamePathType.gs]: GsLables
		[GamePathType.sr]: SrLables
		[GamePathType.zzz]: ZzzLable
	}
}

export type ConfigsType<N extends ConfigName, T extends GamePathType> = Configs[N][T];       