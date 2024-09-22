import { app_version } from "./MysTool"
import { MysReq } from "./MysReq"
import { GameList } from "@/types"

export const BaseHeaders = (mysReq: MysReq<GameList>) => {
	return {
		'x-rpc-app_version': app_version.cn,
		'x-rpc-client_type': '5',
		'x-rpc-device_id': mysReq.device_id,
		'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${mysReq.deviceName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${app_version.cn}`,
		Referer: 'https://webstatic.mihoyo.com'
	}
}

export const BaseOsHeaders = {
	'x-rpc-app_version': app_version.os,
	'x-rpc-client_type': '4',
	'x-rpc-language': 'zh-cn'
}

export const NoHeader = (mysReq: MysReq<GameList>, options: { q?: string, b?: any } = {}) => { return {} }

export const CookieHeader = (mysReq: MysReq<GameList>, options: { q?: string, b?: any } = {}) => {
	return {
		Cookie: mysReq.mysUserInfo!.cookie,
		...(mysReq.hoyolab ? BaseOsHeaders : BaseHeaders(mysReq))
	}
}

export const StokenHeader = (mysReq: MysReq<GameList>) => {
	return {
		...(mysReq.hoyolab ? BaseOsHeaders : BaseHeaders(mysReq)),
		'x-rpc-client_type': '2',
		'User-Agent': 'okhttp/4.8.0',
		Cookie: mysReq.mysUserInfo!.stoken
	}
}

export const NormalHeader = (mysReq: MysReq<GameList>, options: { q?: string, b?: any } = {}) => {
	if (mysReq.hoyolab) {
		return { ...CookieHeader(mysReq, options), DS: mysReq.getDS1('', '', 'os') }
	} else {
		const { q = '', b = '' } = options
		return { ...CookieHeader(mysReq, options), DS: mysReq.getDS2(q, JSON.stringify(b), '4X') }
	}
}

export const PassportHeader = (mysReq: MysReq<GameList>, options: { q?: string, b?: any } = {}) => {
	const { q = '', b = '' } = options
	return {
		'x-rpc-app_version': app_version.cn,
		'x-rpc-game_biz': 'bbs_cn',
		'x-rpc-client_type': '2',
		'User-Agent': 'okhttp/4.8.0',
		'x-rpc-app_id': 'bll8iq97cem8',
		DS: mysReq.getDS1(q, JSON.stringify(b), 'PROD')
	}
}

export const ActionHeader = (mysReq: MysReq<GameList>, options: { q?: string, b?: any } = {}) => {
	const { q = '', b = '' } = options
	return {
		...StokenHeader(mysReq),
		DS: mysReq.getDS1(q, JSON.stringify(b), '6X')
	}
}