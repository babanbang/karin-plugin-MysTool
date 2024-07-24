import { createRenderer, Renderer } from '../renderer';
import { getTypeTable, QRPointType } from '../utils';

enum Type {
    Rect = 'rect',
    Round = 'round',
}

enum PosType {
    Rect = 'rect',
    Round = 'round',
    Planet = 'planet',
    RoundRect = 'roundRect',
}

enum FuncType {
    FuncA = 'A',
    FuncB = 'B',
}

export interface FuncQrOptions {
    funcType?: FuncType;
    type?: Type;
    posType?: PosType;
    otherColor1?: string;
    otherColor2?: string;
    posColor?: string;
}

const FuncQrRenderer: Renderer<FuncQrOptions> = {
    defaultProps: {
        funcType: FuncType.FuncA,
        type: Type.Rect,
        posType: PosType.Rect,
        otherColor1: '#000',
        otherColor2: '#999',
        posColor: '#777',
    },
    listPoints: (props) => {
        const { qrcode } = props;
        if (!qrcode) return [];

        const nCount = qrcode.getModuleCount();
        const typeTable = getTypeTable(qrcode);
        const pointList = [];

        const { type, funcType, posType, otherColor1, otherColor2, posColor } = props;
        let size = props.size;

        const vw = [3, -3];
        const vh = [3, -3];

        const sq25 =
            'M32.048565,-1.29480038e-15 L67.951435,1.29480038e-15 C79.0954192,-7.52316311e-16 83.1364972,1.16032014 87.2105713,3.3391588 C91.2846454,5.51799746 94.4820025,8.71535463 96.6608412,12.7894287 C98.8396799,16.8635028 100,20.9045808 100,32.048565 L100,67.951435 C100,79.0954192 98.8396799,83.1364972 96.6608412,87.2105713 C94.4820025,91.2846454 91.2846454,94.4820025 87.2105713,96.6608412 C83.1364972,98.8396799 79.0954192,100 67.951435,100 L32.048565,100 C20.9045808,100 16.8635028,98.8396799 12.7894287,96.6608412 C8.71535463,94.4820025 5.51799746,91.2846454 3.3391588,87.2105713 C1.16032014,83.1364972 5.01544207e-16,79.0954192 -8.63200256e-16,67.951435 L8.63200256e-16,32.048565 C-5.01544207e-16,20.9045808 1.16032014,16.8635028 3.3391588,12.7894287 C5.51799746,8.71535463 8.71535463,5.51799746 12.7894287,3.3391588 C16.8635028,1.16032014 20.9045808,7.52316311e-16 32.048565,-1.29480038e-15 Z';

        if (size <= 0) size = 1.0;

        if (funcType === FuncType.FuncA && type === Type.Rect) {
            pointList.push(
                `<circle fill='none' stroke-width='${
                    nCount / 15
                }' stroke='${otherColor2}'  cx='${nCount / 2}' cy='${nCount / 2}' r='${
                    ((nCount / 2) * Math.sqrt(2) * 13) / 40
                }' />`,
            );
        }

        for (let x = 0; x < nCount; x++) {
            for (let y = 0; y < nCount; y++) {
                if (qrcode.isDark(x, y) && typeTable[x][y] === QRPointType.POS_CENTER) {
                    if (posType === PosType.Rect) {
                        pointList.push(`<rect width='${1}' height='${1}' fill='${posColor}' x='${x}' y='${y}'/>`);
                    } else if (posType === PosType.Round) {
                        pointList.push(`<circle fill='${posColor}' cx='${x + 0.5}' cy='${y + 0.5}' r='${1.5}' />`);
                        pointList.push(
                            `<circle fill='none' stroke-width='1' stroke='${posColor}'  cx='${
                                x + 0.5
                            }' cy='${y + 0.5}' r='${3}' />`,
                        );
                    } else if (posType === PosType.Planet) {
                        pointList.push(`<circle fill='${posColor}' cx='${x + 0.5}' cy='${y + 0.5}' r='${1.5}' />`);
                        pointList.push(
                            `<circle fill='none' stroke-width='0.15' stroke-dasharray='0.5,0.5' stroke='${posColor}'  cx='${
                                x + 0.5
                            }' cy='${y + 0.5}' r='${3}' />`,
                        );
                        for (let w = 0; w < vw.length; w++) {
                            pointList.push(
                                `<circle fill='${posColor}' cx='${x + vw[w] + 0.5}' cy='${y + 0.5}' r='${0.5}' />`,
                            );
                        }
                        for (let h = 0; h < vh.length; h++) {
                            pointList.push(
                                `<circle fill='${posColor}' cx='${x + 0.5}' cy='${y + vh[h] + 0.5}' r='${0.5}' />`,
                            );
                        }
                    } else if (posType === PosType.RoundRect) {
                        pointList.push(`<circle fill='${posColor}' cx='${x + 0.5}' cy='${y + 0.5}' r='${1.5}' />`);
                        pointList.push(
                            `<path d='${sq25}' stroke='${posColor}' stroke-width='${
                                (100 / 6) * (1 - (1 - 0.8) * 0.75)
                            }' fill='none' transform='${
                                'translate(' +
                                String(x - 2.5) +
                                ',' +
                                String(y - 2.5) +
                                ') ' +
                                'scale(' +
                                String(6 / 100) +
                                ',' +
                                String(6 / 100) +
                                ')'
                            }' />`,
                        );
                    }
                } else if (qrcode.isDark(x, y) && typeTable[x][y] === QRPointType.POS_OTHER) {
                    if (posType === PosType.Rect) {
                        pointList.push(`<rect width='${1}' height='${1}' fill='${posColor}' x='${x}' y='${y}'/>`);
                    }
                } else {
                    const dist =
                        Math.sqrt(Math.pow((nCount - 1) / 2 - x, 2) + Math.pow((nCount - 1) / 2 - y, 2)) /
                        ((nCount / 2) * Math.sqrt(2));
                    if (funcType === FuncType.FuncA) {
                        let sizeF = (1 - Math.cos(Math.PI * dist)) / 6 + 1 / 5;
                        const colorF = otherColor1;
                        const opacityF = Number(qrcode.isDark(x, y));
                        if (type === Type.Rect) {
                            sizeF = sizeF + 0.2;
                            pointList.push(
                                `<rect opacity='${opacityF}' width='${sizeF}' height='${sizeF}' fill='${colorF}' x='${
                                    x + (1 - sizeF) / 2
                                }' y='${y + (1 - sizeF) / 2}'/>`,
                            );
                        } else if (type === Type.Round) {
                            pointList.push(
                                `<circle opacity='${opacityF}' r='${sizeF}' fill='${colorF}' cx='${
                                    x + 0.5
                                }' cy='${y + 0.5}'/>`,
                            );
                        }
                    }
                    if (funcType === FuncType.FuncB) {
                        let sizeF = 0;
                        let colorF = otherColor1;
                        let opacityF = Number(qrcode.isDark(x, y));
                        if (dist > 5 / 20 && dist < 8 / 20) {
                            sizeF = 5 / 10;
                            colorF = otherColor2;
                            opacityF = 1;
                        } else {
                            sizeF = 1 / 4;
                            if (type === Type.Rect) {
                                sizeF = 1 / 4 - 0.1;
                            }
                        }
                        if (type === Type.Rect) {
                            sizeF = 2 * sizeF + 0.1;
                            if (qrcode.isDark(x, y)) {
                                pointList.push(
                                    `<rect opacity='${opacityF}' width='${sizeF}' height='${sizeF}' fill='${colorF}' x='${
                                        x + (1 - sizeF) / 2
                                    }' y='${y + (1 - sizeF) / 2}'/>`,
                                );
                            } else {
                                sizeF = sizeF - 0.1;
                                pointList.push(
                                    `<rect opacity='${opacityF}' width='${sizeF}' height='${sizeF}' stroke='${colorF}' stroke-width='${0.1}' fill='#FFFFFF' x='${
                                        x + (1 - sizeF) / 2
                                    }' y='${y + (1 - sizeF) / 2}'/>`,
                                );
                            }
                        } else if (type === Type.Round) {
                            if (qrcode.isDark(x, y)) {
                                pointList.push(
                                    `<circle opacity='${opacityF}' r='${sizeF}' fill='${colorF}' cx='${
                                        x + 0.5
                                    }' cy='${y + 0.5}'/>`,
                                );
                            } else {
                                pointList.push(
                                    `<circle opacity='${opacityF}' r='${sizeF}' stroke='${colorF}' stroke-width='${0.1}' fill='#FFFFFF' cx='${
                                        x + 0.5
                                    }' cy='${y + 0.5}'/>`,
                                );
                            }
                        }
                    }
                }
            }
        }

        return pointList;
    },
};

export const FuncQr = createRenderer<FuncQrOptions>(FuncQrRenderer);
export default FuncQr;
