module.exports = {
  settings: {
    'import/resolver': {
      alias: [
        ['#Karin', './lib/index.js'],
        ['#Mys.tool', './lib/tool/index.js'],
        ['#Mys.api', './lib/mys/index.js'],
        ['#Mys.user', './lib/user/index.js'],
        ['#Mys.rank', './lib/rank/index.js']
      ]
    }
  }
}
