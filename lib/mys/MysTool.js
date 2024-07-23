const app_version = { cn: '2.70.1', os: '1.5.0' };
const app_id = 2; //崩三 1 未定 2 原神 4 崩二 7 崩铁 8 绝区零 12
const salt = {
    os: '6cqshh5dhw73bzxn20oexa9k516chk7s',
    '4X': 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
    '6X': 't0qEgfub6cvueAPgR5m9aQWWVciEer7v',
    K2: 'S9Hrn38d2b55PamfIR9BNA3Tx9sQTOem',
    LK2: 'sjdNFJB7XxyDWGIAk0eTV8AOCfMJmyEo',
    PROD: 'JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS'
};
const web_api = 'https://api-takumi.mihoyo.com/';
const os_web_api = 'https://api-os-takumi.mihoyo.com/';
const new_web_api = 'https://api-takumi.miyoushe.com/';
const static_api = 'https://api-takumi-static.mihoyo.com/';
const record_api = 'https://api-takumi-record.mihoyo.com/';
const os_record_api = 'https://bbs-api-os.mihoyo.com/';
const bbs_api = 'https://bbs-api.miyoushe.com/';
const os_bbs_api = 'https://bbs-api-os.mihoyo.com/';
const hk4_api = 'https://hk4e-api.mihoyo.com/';
const os_hk4_api = 'https://hk4e-api-os.hoyoverse.com/';
const os_hk4e_sg_api = 'https://sg-hk4e-api.hoyolab.com/';
const os_public_sg_api = 'https://sg-public-api.hoyolab.com/';
const pass_api = 'https://passport-api.mihoyo.com/';
const hk4e_sdk_api = 'https://hk4e-sdk.mihoyo.com/';
const hk4e_gacha_api = 'https://public-operation-hk4e.mihoyo.com/';
const nap_gacha_api = 'https://public-operation-nap.mihoyo.com/';
const os_nap_gacha_api = 'https://public-operation-nap-sg.hoyoverse.com/';
const os_public_api = 'https://sg-public-api.hoyoverse.com/';
const public_data_api = 'https://public-data-api.mihoyo.com/';
const os_public_data_api = 'https://sg-public-data-api.hoyoverse.com/';
const act_nap_api = 'https://act-nap-api.mihoyo.com/';
const os_act_nap_api = 'https://sg-act-nap-api.mihoyo.com/';
const game_biz = {
    gs: ['hk4e_cn', 'hk4e_global'],
    sr: ['hkrpg_cn', 'hkrpg_global'],
    zzz: ['nap_cn', 'nap_global']
};
function setRegion(regions) {
    const names = ['美服', '欧服', '亚服', '港澳台服'];
    return regions.map((region, idx) => {
        return { region, name: names[idx], os: true };
    });
}
const game_region = {
    gs: [
        { region: 'cn_gf01', name: '天空岛(官服)', os: false }, { region: 'cn_qd01', name: '世界树(B服)', os: false },
        ...setRegion(['os_usa', 'os_euro', 'os_asia', 'os_cht'])
    ],
    sr: [
        { region: 'prod_gf_cn', name: '星穹列车(官服)', os: false }, { region: 'prod_qd_cn', name: '无名客(B服)', os: false },
        ...setRegion(['prod_official_usa', 'prod_official_euro', 'prod_official_asia', 'prod_official_cht'])
    ],
    zzz: [
        { region: 'prod_gf_cn', name: '新艾利都(官服)', os: false }, { region: 'prod_gf_cn', name: '新艾利都(官服)', os: false },
        ...setRegion(['prod_gf_us', 'prod_gf_eu', 'prod_gf_jp', 'prod_gf_sg'])
    ]
};
export { app_id, app_version, bbs_api, game_biz, game_region, hk4_api, hk4e_gacha_api, hk4e_sdk_api, new_web_api, os_bbs_api, os_hk4_api, os_public_api, os_public_data_api, os_record_api, os_web_api, pass_api, public_data_api, record_api, salt, static_api, web_api, os_hk4e_sg_api, os_public_sg_api, nap_gacha_api, os_nap_gacha_api, act_nap_api, os_act_nap_api };
export const MysTool = {
    app_id, app_version, bbs_api, game_biz, game_region, hk4_api, hk4e_gacha_api, hk4e_sdk_api,
    new_web_api, os_bbs_api, os_hk4_api, os_public_api, os_public_data_api, os_record_api, os_web_api,
    pass_api, public_data_api, record_api, salt, static_api, web_api, os_hk4e_sg_api, os_public_sg_api,
    nap_gacha_api, os_nap_gacha_api, act_nap_api, os_act_nap_api
};
