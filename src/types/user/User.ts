import { GameList, GameRegion, MysType } from "@/types/mys"
import { BingUIDType } from "./db"

export interface UidWithType {
    uid: string
    type: BingUIDType
    main: boolean
}

export interface UidListWithType {
    list: UidWithType[],
    ban: UidWithType[]
}

export interface mysUserInfo<g extends GameList> {
    type?: MysType
    ltuid?: string
    user_id?: string
    cookie?: string
    stoken?: string
    device?: string
    region?: GameRegion<g>
    uidType?: BingUIDType
    owner?: boolean
}