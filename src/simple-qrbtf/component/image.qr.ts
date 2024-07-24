import { createRenderer, Renderer } from '../renderer';
import { defaultImage, getTypeTable, QRPointType } from '../utils';

enum Type {
    Rect = 'rect',
    Round = 'round',
}

enum PosType {
    Rect = 'rect',
    Round = 'round',
    Planet = 'planet',
}

export interface ImageQrOptions {
    image?: string;
    type?: Type;
    size?: number;
    opacity?: number;
    darkColor?: string;
    lightColor?: string;
    posType?: PosType;
    posColor?: string;
}

const ImageQrRenderer: Renderer<ImageQrOptions> = {
    defaultProps: {
        image: defaultImage,
        type: Type.Rect,
        size: 100,
        opacity: 100,
        darkColor: '#000000',
        lightColor: '#FFFFFF',
        posType: PosType.Rect,
        posColor: '#000000',
    },
    listPoints: (props) => {
        const { qrcode } = props;
        if (!qrcode) return [];

        const nCount = qrcode.getModuleCount();
        const typeTable = getTypeTable(qrcode);
        const pointList = new Array(nCount);

        let size = props.size / 100 / 3;
        const opacity = props.opacity / 100;

        const { type, darkColor, lightColor, posType, posColor, image } = props;

        const vw = [3, -3];
        const vh = [3, -3];

        if (size <= 0) size = 1.0;

        pointList.push(`<image x='0' y='0' width='${nCount}' height='${nCount}' xlink:href='${image}'/>`);

        for (let x = 0; x < nCount; x++) {
            for (let y = 0; y < nCount; y++) {
                if (
                    typeTable[x][y] === QRPointType.ALIGN_CENTER ||
                    typeTable[x][y] === QRPointType.ALIGN_OTHER ||
                    typeTable[x][y] === QRPointType.TIMING
                ) {
                    if (qrcode.isDark(x, y)) {
                        if (type === Type.Rect) {
                            pointList.push(
                                `<rect opacity='${opacity}' width='${size}' height='${size}' fill='${darkColor}' x='${
                                    x + (1 - size) / 2
                                }' y='${y + (1 - size) / 2}'/>`,
                            );
                        } else if (type === Type.Round)
                            pointList.push(
                                `<circle opacity='${opacity}' r='${
                                    size / 2
                                }' fill='${darkColor}' cx='${x + 0.5}' cy='${y + 0.5}'/>`,
                            );
                    } else {
                        if (type === Type.Rect) {
                            pointList.push(
                                `<rect opacity='${opacity}' width='${size}' height='${size}' fill='${lightColor}' x='${
                                    x + (1 - size) / 2
                                }' y='${y + (1 - size) / 2}'/>`,
                            );
                        } else if (type === Type.Round) {
                            pointList.push(
                                `<circle opacity='${opacity}' r='${
                                    size / 2
                                }' fill='${lightColor}' cx='${x + 0.5}' cy='${y + 0.5}'/>`,
                            );
                        }
                    }
                } else if (typeTable[x][y] === QRPointType.POS_CENTER) {
                    if (qrcode.isDark(x, y)) {
                        if (posType === PosType.Rect) {
                            pointList.push(`<rect width='${1}' height='${1}' fill='${posColor}' x='${x}' y='${y}'/>`);
                        } else if (posType === PosType.Round) {
                            pointList.push(`<circle fill='white' cx='${x + 0.5}' cy='${y + 0.5}' r='${5}' />`);
                            pointList.push(`<circle fill='${posColor}' cx='${x + 0.5}' cy='${y + 0.5}' r='${1.5}' />`);
                            pointList.push(
                                `<circle fill='none' stroke-width='1' stroke='${posColor}'  cx='${
                                    x + 0.5
                                }' cy='${y + 0.5}' r='${3}' />`,
                            );
                        } else if (posType === PosType.Planet) {
                            pointList.push(`<circle fill='white' cx='${x + 0.5}' cy='${y + 0.5}' r='${5}' />`);
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
                        }
                    }
                } else if (typeTable[x][y] === QRPointType.POS_OTHER) {
                    if (qrcode.isDark(x, y)) {
                        if (posType === PosType.Rect) {
                            pointList.push(`<rect width='${1}' height='${1}' fill='${posColor}' x='${x}' y='${y}'/>`);
                        }
                    } else {
                        if (posType === PosType.Rect) {
                            pointList.push(`<rect width='${1}' height='${1}' fill='white' x='${x}' y='${y}'/>`);
                        }
                    }
                } else {
                    if (qrcode.isDark(x, y)) {
                        if (type === Type.Rect)
                            pointList.push(
                                `<rect opacity='${opacity}' width='${size}' height='${size}' fill='${darkColor}' x='${
                                    x + (1 - size) / 2
                                }' y='${y + (1 - size) / 2}'/>`,
                            );
                        else if (type === Type.Round)
                            pointList.push(
                                `<circle opacity='${opacity}' r='${
                                    size / 2
                                }' fill='${darkColor}' cx='${x + 0.5}' cy='${y + 0.5}'/>`,
                            );
                    } else {
                        if (type === Type.Rect)
                            pointList.push(
                                `<rect opacity='${opacity}' width='${size}' height='${size}' fill='${lightColor}' x='${
                                    x + (1 - size) / 2
                                }' y='${y + (1 - size) / 2}'/>`,
                            );
                        else if (type === Type.Round)
                            pointList.push(
                                `<circle opacity='${opacity}' r='${
                                    size / 2
                                }' fill='${lightColor}' cx='${x + 0.5}' cy='${y + 0.5}'/>`,
                            );
                    }
                }
            }
        }

        return pointList;
    },
};

export const ImageQr = createRenderer<ImageQrOptions>(ImageQrRenderer);
export default ImageQr;
