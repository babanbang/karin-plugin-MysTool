import { logger } from 'node-karin'
import { Cfg, GamePathType, PluginName } from '@/utils'
export * from '@/mys'
export * from '@/panel'
export * from '@/types'
export * from '@/user'
export * from '@/utils'

const pkg = Cfg.package(GamePathType.Core)
logger.info(`${logger.violet(`[插件:${pkg.version}]`)} ${logger.green(PluginName)} 初始化完成~`)