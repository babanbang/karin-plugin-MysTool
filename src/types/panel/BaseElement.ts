import { GameList } from "../mys"

export const enum GsElement {
	/** 风 */
	anemo = 'anemo',
	/** 岩 */
	geo = 'geo',
	/** 冰 */
	cryo = 'cryo',
	/** 雷 */
	electro = 'electro',
	/** 草 */
	dendro = 'dendro',
	/** 火 */
	pyro = 'pyro',
	/** 水 */
	hydro = 'hydro',
	/** 无 */
	multi ='multi'
}

export const enum SrElement {
	/** 火 */
	fire = 'fire',
	/** 冰 */
	ice = 'ice',
	/** 风 */
	wind = 'wind',
	/** 雷 */
	elec = 'elec',
	/** 物理 */
	phy = 'phy',
	/** 量子 */
	quantum = 'quantum',
	/** 虚数 */
	imaginary = 'imaginary'
}

export const enum ZzzElement {
	/** 火 */
	fire = 'fire',
	/** 冰 */
	ice = 'ice',
	/** 电 */
	elec = 'elec',
	/** 物理 */
	phy = 'phy',
	/** 以太 */
	ether = 'ether'
}

export type ElementType<g extends GameList> = {
	[GameList.Gs]: GsElement
	[GameList.Sr]: SrElement
	[GameList.Zzz]: ZzzElement
}[g]