import { createRenderer, Renderer } from '../renderer';
import { getTypeTable, QRPointType } from '../utils';

enum Type {
    Rect = 'rect',
    Dsj = 'dsj',
}

export interface DSJQrOptions {
    scale?: number;
    crossWidth?: number;
    posWidth?: number;
    posType?: Type | string;
}

const DsjQrRenderer: Renderer<DSJQrOptions> = {
    defaultProps: {
        scale: 100,
        crossWidth: 100,
        posWidth: 100,
        posType: 'rect',
    },
    listPoints: (props) => {
        const { qrcode } = props;
        if (!qrcode) return [];

        const nCount = qrcode.getModuleCount();
        const typeTable = getTypeTable(qrcode);
        const pointList = [];
        const g1 = [];
        const g2 = [];

        let width2 = props.scale! / 100;
        let width1 = props.crossWidth! / 100;
        const width3 = props.posWidth! / 100;
        const posType = props.posType;

        if (width2 <= 0) width2 = 70;
        if (width1 <= 0) width1 = 70;

        const available: Array<Array<boolean>> = [];
        const ava2: Array<Array<boolean>> = [];
        for (let x = 0; x < nCount; x++) {
            available[x] = [];
            ava2[x] = [];
            for (let y = 0; y < nCount; y++) {
                available[x][y] = true;
                ava2[x][y] = true;
            }
        }

        for (let y = 0; y < nCount; y++) {
            for (let x = 0; x < nCount; x++) {
                if (qrcode.isDark(x, y) === false) {
                    // do nothing;
                } else if (typeTable[x][y] === QRPointType.POS_CENTER) {
                    if (posType === Type.Rect) {
                        pointList.push(`<rect width='${1}' height='${1}' fill='#0B2D97' x='${x}' y='${y}'/>`);
                    } else if (posType === Type.Dsj) {
                        pointList.push(
                            `<rect width='${3 - (1 - width3)}' height='${
                                3 - (1 - width3)
                            }' fill='#0B2D97' x='${x - 1 + (1 - width3) / 2}' y='${y - 1 + (1 - width3) / 2}'/>`,
                        );
                        pointList.push(
                            `<rect width='${width3}' height='${
                                3 - (1 - width3)
                            }' fill='#0B2D97' x='${x - 3 + (1 - width3) / 2}' y='${y - 1 + (1 - width3) / 2}'/>`,
                        );
                        pointList.push(
                            `<rect width='${width3}' height='${
                                3 - (1 - width3)
                            }' fill='#0B2D97' x='${x + 3 + (1 - width3) / 2}' y='${y - 1 + (1 - width3) / 2}'/>`,
                        );
                        pointList.push(
                            `<rect width='${3 - (1 - width3)}' height='${width3}' fill='#0B2D97' x='${
                                x - 1 + (1 - width3) / 2
                            }' y='${y - 3 + (1 - width3) / 2}'/>`,
                        );
                        pointList.push(
                            `<rect width='${3 - (1 - width3)}' height='${width3}' fill='#0B2D97' x='${
                                x - 1 + (1 - width3) / 2
                            }' y='${y + 3 + (1 - width3) / 2}'/>`,
                        );
                    }
                } else if (typeTable[x][y] === QRPointType.POS_OTHER) {
                    if (posType === Type.Rect) {
                        pointList.push(`<rect width='${1}' height='${1}' fill='#0B2D97' x='${x}' y='${y}'/>`);
                    }
                } else {
                    if (available[x][y] && ava2[x][y] && x < nCount - 2 && y < nCount - 2) {
                        let ctn = true;
                        for (let i = 0; i < 3; i++) {
                            for (let j = 0; j < 3; j++) {
                                if (ava2[x + i][y + j] === false) {
                                    ctn = false;
                                }
                            }
                        }
                        if (
                            ctn &&
                            qrcode.isDark(x + 2, y) &&
                            qrcode.isDark(x + 1, y + 1) &&
                            qrcode.isDark(x, y + 2) &&
                            qrcode.isDark(x + 2, y + 2)
                        ) {
                            g1.push(
                                `<line x1='${x + width1 / Math.sqrt(8)}' y1='${
                                    y + width1 / Math.sqrt(8)
                                }' x2='${x + 3 - width1 / Math.sqrt(8)}' y2='${
                                    y + 3 - width1 / Math.sqrt(8)
                                }' fill='none' stroke='#0B2D97' stroke-width='${width1}' />`,
                            );
                            g1.push(
                                `<line x1='${x + 3 - width1 / Math.sqrt(8)}' y1='${
                                    y + width1 / Math.sqrt(8)
                                }' x2='${x + width1 / Math.sqrt(8)}' y2='${
                                    y + 3 - width1 / Math.sqrt(8)
                                }' fill='none' stroke='#0B2D97' stroke-width='${width1}' />`,
                            );
                            available[x][y] = false;
                            available[x + 2][y] = false;
                            available[x][y + 2] = false;
                            available[x + 2][y + 2] = false;
                            available[x + 1][y + 1] = false;
                            for (let i = 0; i < 3; i++) {
                                for (let j = 0; j < 3; j++) {
                                    ava2[x + i][y + j] = false;
                                }
                            }
                        }
                    }
                    if (available[x][y] && ava2[x][y] && x < nCount - 1 && y < nCount - 1) {
                        let ctn = true;
                        for (let i = 0; i < 2; i++) {
                            for (let j = 0; j < 2; j++) {
                                if (ava2[x + i][y + j] === false) {
                                    ctn = false;
                                }
                            }
                        }
                        if (ctn && qrcode.isDark(x + 1, y) && qrcode.isDark(x, y + 1) && qrcode.isDark(x + 1, y + 1)) {
                            g1.push(
                                `<line x1='${x + width1 / Math.sqrt(8)}' y1='${
                                    y + width1 / Math.sqrt(8)
                                }' x2='${x + 2 - width1 / Math.sqrt(8)}' y2='${
                                    y + 2 - width1 / Math.sqrt(8)
                                }' fill='none' stroke='#0B2D97' stroke-width='${width1}' />`,
                            );
                            g1.push(
                                `<line x1='${x + 2 - width1 / Math.sqrt(8)}' y1='${
                                    y + width1 / Math.sqrt(8)
                                }' x2='${x + width1 / Math.sqrt(8)}' y2='${
                                    y + 2 - width1 / Math.sqrt(8)
                                }' fill='none' stroke='#0B2D97' stroke-width='${width1}' />`,
                            );
                            for (let i = 0; i < 2; i++) {
                                for (let j = 0; j < 2; j++) {
                                    available[x + i][y + j] = false;
                                    ava2[x + i][y + j] = false;
                                }
                            }
                        }
                    }
                    if (available[x][y] && ava2[x][y]) {
                        if (y === 0 || (y > 0 && (!qrcode.isDark(x, y - 1) || !ava2[x][y - 1]))) {
                            const start = y;
                            let end = y;
                            let ctn = true;
                            while (ctn && end < nCount) {
                                if (qrcode.isDark(x, end) && ava2[x][end]) {
                                    end++;
                                } else {
                                    ctn = false;
                                }
                            }
                            if (end - start > 2) {
                                for (let i = start; i < end; i++) {
                                    ava2[x][i] = false;
                                    available[x][i] = false;
                                }
                                g2.push(
                                    `<rect width='${width2}' height='${
                                        end - start - 1 - (1 - width2)
                                    }' fill='#E02020' x='${x + (1 - width2) / 2}' y='${y + (1 - width2) / 2}'/>`,
                                );
                                g2.push(
                                    `<rect width='${width2}' height='${width2}' fill='#E02020' x='${
                                        x + (1 - width2) / 2
                                    }' y='${end - 1 + (1 - width2) / 2}'/>`,
                                );
                            }
                        }
                    }
                    if (available[x][y] && ava2[x][y]) {
                        if (x === 0 || (x > 0 && (!qrcode.isDark(x - 1, y) || !ava2[x - 1][y]))) {
                            const start = x;
                            let end = x;
                            let ctn = true;
                            while (ctn && end < nCount) {
                                if (qrcode.isDark(end, y) && ava2[end][y]) {
                                    end++;
                                } else {
                                    ctn = false;
                                }
                            }
                            if (end - start > 1) {
                                for (let i = start; i < end; i++) {
                                    ava2[i][y] = false;
                                    available[i][y] = false;
                                }
                                g2.push(
                                    `<rect width='${end - start - (1 - width2)}' height='${width2}' fill='#F6B506' x='${
                                        x + (1 - width2) / 2
                                    }' y='${y + (1 - width2) / 2}'/>`,
                                );
                            }
                        }
                    }
                    if (available[x][y]) {
                        pointList.push(
                            `<rect width='${width2}' height='${width2}' fill='#F6B506' x='${
                                x + (1 - width2) / 2
                            }' y='${y + (1 - width2) / 2}'/>`,
                        );
                    }
                }
            }
        }

        for (let i = 0; i < g1.length; i++) {
            pointList.push(g1[i]);
        }
        for (let i = 0; i < g2.length; i++) {
            pointList.push(g2[i]);
        }
        return pointList;
    },
};

export const DsjQR = createRenderer<DSJQrOptions>(DsjQrRenderer);
export default DsjQR;
