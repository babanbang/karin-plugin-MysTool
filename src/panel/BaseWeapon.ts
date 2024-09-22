import { GameList, WeaponBaseInfo } from "@/types";
import { BasePanel } from "./BasePanel";

export class BaseWeapon<g extends GameList> extends BasePanel<g>{
	id: WeaponBaseInfo<g>["id"]
	name: WeaponBaseInfo<g>["name"]
	/** 武器类型 */
	type: WeaponBaseInfo<g>["type"]
	rarity: WeaponBaseInfo<g>["rarity"]

	constructor(game: g, Info: WeaponBaseInfo<g>) {
		super(game)

		this.id = Info.id
		this.name = Info.name
		this.type = Info.type
		this.rarity = Info.rarity
	}
}