import { createRenderer, Renderer } from '../renderer';
import { rand } from '../utils';

// eslint-disable-next-line @typescript-eslint/ban-types
export declare type RandRectOptions = {};

const RandRectRenderer: Renderer<RandRectOptions> = {
    defaultProps: {},
    listPoints: (props) => {
        const { qrcode } = props;
        if (!qrcode) return [];

        const nCount = qrcode.getModuleCount();
        const pointList = [];

        const randArr = [];
        for (let row = 0; row < nCount; row++) {
            for (let col = 0; col < nCount; col++) {
                randArr.push([row, col]);
            }
        }
        randArr.sort(function () {
            return 0.5 - Math.random();
        });

        for (let i = 0; i < randArr.length; i++) {
            const row = randArr[i][0];
            const col = randArr[i][1];
            if (qrcode.isDark(row, col)) {
                const tempRand = rand(0.8, 1.3);
                const randNum = rand(50, 230);
                const tempRGB = [
                    'rgb(' +
                        Math.floor(20 + randNum) +
                        ',' +
                        Math.floor(170 - randNum / 2) +
                        ',' +
                        Math.floor(60 + randNum * 2) +
                        ')',
                    'rgb(' +
                        Math.floor(-20 + randNum) +
                        ',' +
                        Math.floor(130 - randNum / 2) +
                        ',' +
                        Math.floor(20 + randNum * 2) +
                        ')',
                ];
                const width = 0.15;

                pointList.push(
                    `<rect opacity='0.9' fill='${tempRGB[1]}' width='${
                        1 * tempRand + width
                    }' height='${1 * tempRand + width}' x='${
                        row - (tempRand - 1) / 2
                    }' y='${col - (tempRand - 1) / 2}'/>`,
                );
                pointList.push(
                    `<rect fill='${tempRGB[0]}' width='${1 * tempRand}' height='${
                        1 * tempRand
                    }' x='${row - (tempRand - 1) / 2}' y='${col - (tempRand - 1) / 2}'/>`,
                );
            }
        }
        return pointList;
    },
};

export const RandRectQr = createRenderer<RandRectOptions>(RandRectRenderer);
export default RandRectQr;
