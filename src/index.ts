import { logger } from 'node-karin'
import { Cfg, PluginName } from '@/utils'
export * from '@/mys'
export * from '@/panel'
export * from '@/types'
export * from '@/user'
export * from '@/utils'

logger.info(`${logger.violet(`[插件:${Cfg.package.version}]`)} ${logger.green(PluginName)} 初始化完成~`)