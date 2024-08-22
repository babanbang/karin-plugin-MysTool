import { CoreQrbtfStyles } from '@/types';
import { Data } from '../Data';
import { BaseQr, BaseQrOptions, CircleQr, CircleQrOption, DsjQR, DSJQrOptions, FuncQr, FuncQrOptions, ImageFillQr, ImageFillQrOptions, ImageQr, ImageQrOptions, LineQr, LineQrOptions, RandRectQr, SolidQr, SolidQrOptions } from './component';
import { DeepPartial } from './helper';
import { DefaultRendererOptions, RendererOptions } from './renderer';

export enum SimpleQrType {
	base = 'base',
	circle = 'circle',
	dsj = 'dsj',
	randRect = 'randRect',
	line = 'line',
	solid = 'solid',
	image = 'image',
	func = 'func',
	imageFill = 'imageFill',
}

export const SimpleQr = {
	[SimpleQrType.base]: BaseQr,
	[SimpleQrType.circle]: CircleQr,
	[SimpleQrType.dsj]: DsjQR,
	[SimpleQrType.randRect]: RandRectQr,
	[SimpleQrType.line]: LineQr,
	[SimpleQrType.solid]: SolidQr,
	[SimpleQrType.image]: ImageQr,
	[SimpleQrType.func]: FuncQr,
	[SimpleQrType.imageFill]: ImageFillQr,
};

const SimpleQrOptions = {
	[SimpleQrType.base]: (content: string, Option: any): DeepPartial<RendererOptions<BaseQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.circle]: (content: string, Option: any): DeepPartial<RendererOptions<CircleQrOption>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.dsj]: (content: string, Option: any): DeepPartial<RendererOptions<DSJQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.randRect]: (content: string, Option: any): DeepPartial<DefaultRendererOptions> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.line]: (content: string, Option: any): DeepPartial<RendererOptions<LineQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.solid]: (content: string, Option: any): DeepPartial<RendererOptions<SolidQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.image]: (content: string, Option: any): DeepPartial<RendererOptions<ImageQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.func]: (content: string, Option: any): DeepPartial<RendererOptions<FuncQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	},
	[SimpleQrType.imageFill]: (content: string, Option: any): DeepPartial<RendererOptions<ImageFillQrOptions>> => {
		return {
			content, ...Data.getData(Option, ['size'])
		}
	}
};

export const getSimpleQrOption = <T extends SimpleQrType>(type: T, content: string, Option: CoreQrbtfStyles<T>) => SimpleQrOptions[type](content, Option);