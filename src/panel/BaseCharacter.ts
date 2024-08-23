import { CharacterInfoData } from "@/types";
import { GameList } from "..";
import { BasePanel } from "./BasePanel";

export class BaseCharacter extends BasePanel {
	id: number
	name: string
	constructor(game: GameList, Info: CharacterInfoData) {
		super(game)

		this.id = Info.id
		this.name = Info.name
	}

	static get() {

	}
}