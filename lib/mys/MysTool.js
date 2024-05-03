const app_version = { cn: '2.70.1', os: '1.5.0' }
const app_id = 12
const salt = {
  os: '6cqshh5dhw73bzxn20oexa9k516chk7s',
  '4X': 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
  '6X': 't0qEgfub6cvueAPgR5m9aQWWVciEer7v',
  K2: 'S9Hrn38d2b55PamfIR9BNA3Tx9sQTOem',
  LK2: 'sjdNFJB7XxyDWGIAk0eTV8AOCfMJmyEo',
  PROD: 'JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS'
}
const web_api = 'https://api-takumi.mihoyo.com/'
const os_web_api = 'https://api-os-takumi.mihoyo.com/'
const new_web_api = 'https://api-takumi.miyoushe.com/'
const record_api = 'https://api-takumi-record.mihoyo.com/'
const bbs_api = 'https://bbs-api.mihoyo.com/'
const os_bbs_api = 'https://bbs-api-os.mihoyo.com/'// record_api
const hk4_api = 'https://hk4e-api.mihoyo.com/'
const os_hk4_api = 'https://hk4e-api-os.hoyoverse.com/'
const public_data_api = 'https://public-data-api.mihoyo.com/'
const pass_api = 'https://passport-api.mihoyo.com/'
const hk4e_sdk_api = 'https://hk4e-sdk.mihoyo.com/'
const game_biz = {
  gs: ['hk4e_cn', 'hk4e_global'],
  sr: ['hkrpg_cn', 'hkrpg_global'],
  zzz: []
}

export {
  app_version, app_id, bbs_api, game_biz, hk4_api, new_web_api, os_bbs_api, hk4e_sdk_api,
  os_hk4_api, os_web_api, pass_api, public_data_api, record_api, salt, web_api
}
export default {
  app_version,
  app_id,
  bbs_api,
  game_biz,
  hk4_api,
  new_web_api,
  os_bbs_api,
  hk4e_sdk_api,
  os_hk4_api,
  os_web_api,
  pass_api,
  public_data_api,
  record_api,
  salt,
  web_api
}
