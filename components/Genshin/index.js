import { getDirPath } from '#Mys.tool'
export * from './Apps/role.js'
// export * from './Apps/abyss.js'
export * from './Apps/explore.js'

const Path = getDirPath(import.meta.url)
for (const type of ['artifact', 'character', 'weapon']) {
  await import(`file://${Path}/resources/meta/${type}/index.js`)
}
