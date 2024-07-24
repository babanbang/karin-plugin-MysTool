import { createRenderer, Renderer } from '../renderer';
import { defaultImage } from '../utils';

export interface ImageFillQrOptions {
    image: string;
    color: string;
}

const ImageFillRenderer: Renderer<ImageFillQrOptions> = {
    defaultProps: {
        image: defaultImage,
        color: 'rgba(0,0,0,0)',
    },
    listPoints: (props) => {
        const { qrcode } = props;
        if (!qrcode) return [];

        const nCount = qrcode.getModuleCount();
        const pointList = new Array(nCount);

        const color = props.color;
        const opacity = props.opacity / 100;
        const image = props.image;

        pointList.push(
            `<image x='-0.01' y='-0.01' width='${nCount + 0.02}' height='${nCount + 0.02}' xlink:href='${image}'/>`,
        );
        pointList.push(
            `<rect x='-0.01' y='-0.01' width='${nCount + 0.02}' height='${
                nCount + 0.02
            }' fill='${color}' opacity='${opacity}'/>`,
        );

        for (let x = 0; x < nCount; x++) {
            for (let y = 0; y < nCount; y++) {
                if (!qrcode.isDark(x, y)) {
                    pointList.push(
                        `<rect width='${1.02}' height='${1.02}' fill='#FFF' x='${x - 0.01}' y='${y - 0.01}'/>`,
                    );
                }
            }
        }

        return pointList;
    },
};
export const ImageFillQr = createRenderer<ImageFillQrOptions>(ImageFillRenderer);

export default ImageFillQr;
