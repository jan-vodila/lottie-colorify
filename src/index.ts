import cloneDeep from 'lodash.clonedeep';

export const colorify = (destColors: (string | number[] | undefined)[] = [], lottieObj: any, immutable = true) => {
  const modifiedColors = [];
  for (const color of destColors) {
    modifiedColors.push(convertColorToLottieColor(color));
  }

  const newLottie = modifyColors(modifiedColors, immutable ? cloneDeep(lottieObj) : lottieObj);
  return newLottie;
};

const convertColorToLottieColor = (color: string | number[] | undefined) => {
  if (typeof color === 'string' && color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i)) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(color);
    if (!result) {
      throw new Error('Color can be only hex or rgba format (ex. [10,20,30,0.5])');
    }

    const colorArray = [
      Math.round((parseInt(result[1], 16) / 255) * 1000) / 1000,
      Math.round((parseInt(result[2], 16) / 255) * 1000) / 1000,
      Math.round((parseInt(result[3], 16) / 255) * 1000) / 1000,
    ];

    if (result[4]) {
      colorArray.push(parseInt(result[4], 16) / 255);
    }

    return colorArray;
  } else if (
      typeof color === 'object' &&
      color.length >= 3 &&
      color.length <= 4 &&
      color.every((item) => item >= 0 && item <= 255)) {

    const colorArray = [
      Math.round((color[0] / 255) * 1000) / 1000,
      Math.round((color[1] / 255) * 1000) / 1000,
      Math.round((color[2] / 255) * 1000) / 1000,
    ];

    if (color.length === 4) {
      colorArray.push(color[3]);
    }

    return colorArray;
  } else if (!color) {
    return undefined;
  } else {
    throw new Error('Color can be only hex or rgba format (ex. [10,20,30,0.5])');
  }
};

const round = (n: number) => Math.round(n * 1000) / 1000;

export const replaceColor = (
  sourceColor: string | number[],
  targetColor: string | number[],
  lottieObj: any,
  immutable = true,
) => {
  const genSourceLottieColor = convertColorToLottieColor(sourceColor);
  const genTargetLottieColor = convertColorToLottieColor(targetColor);
  if (!genSourceLottieColor || !genTargetLottieColor) {
    throw new Error('Proper colors must be used for both source and target');
  }
  function doReplace(sourceLottieColor: number[], targetLottieColor: number[], obj: any) {
    if (obj.s && Array.isArray(obj.s) && obj.s.length === 4) {
      if (
          sourceLottieColor[0] === round(obj.s[0]) &&
          sourceLottieColor[1] === round(obj.s[1]) &&
          sourceLottieColor[2] === round(obj.s[2])
      ) {
        if ((sourceLottieColor.length < 4 && obj.s[3] === 1) ||
            (sourceLottieColor.length === 4 && sourceLottieColor[3] === obj.s[3])
        ) {
          obj.s = [
            targetLottieColor[0],
            targetLottieColor[1],
            targetLottieColor[2],
            targetLottieColor[3] ? targetLottieColor[3] : 1,
          ];
        }
      }

    } else if (obj.c && obj.c.k) {
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] !== 'number') {
        doReplace(sourceLottieColor, targetLottieColor, obj.c.k);
      } else if (
        sourceLottieColor[0] === round(obj.c.k[0]) &&
        sourceLottieColor[1] === round(obj.c.k[1]) &&
        sourceLottieColor[2] === round(obj.c.k[2])
      ) {
        if ((sourceLottieColor.length < 4 && obj.c.k.length < 4) ||
            (sourceLottieColor.length < 4 && obj.c.k.length === 4 && obj.c.k[3] === 1) ||
            (sourceLottieColor.length === 4 && obj.c.k.length === 4 && sourceLottieColor[3] === obj.c.k[3])
        ) {
          obj.c.k = [
            targetLottieColor[0],
            targetLottieColor[1],
            targetLottieColor[2],
          ];

          if (sourceLottieColor.length === 4) {
            obj.c.k.push(targetLottieColor[3] ? targetLottieColor[3] : 1);
          }
        }
      }
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          doReplace(sourceLottieColor, targetLottieColor, obj[key]);
        }
      }
    }

    return obj;
  }
  return doReplace(genSourceLottieColor, genTargetLottieColor, immutable ? cloneDeep(lottieObj) : lottieObj);
};

export const flatten = (targetColor: string | number[], lottieObj: any, immutable = true) => {
  const genTargetLottieColor = convertColorToLottieColor(targetColor);
  if (!genTargetLottieColor) {
    throw new Error('Proper colors must be used for target');
  }
  function doFlatten(targetLottieColor: number[], obj: any) {
    if (obj.s && Array.isArray(obj.s) && obj.s.length === 4) {
      obj.s = [...targetLottieColor, 1];
    } else if (obj.c && obj.c.k) {
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] !== 'number') {
        doFlatten(targetLottieColor, obj.c.k);
      } else {
        obj.c.k = targetLottieColor;
      }
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          doFlatten(targetLottieColor, obj[key]);
        }
      }
    }

    return obj;
  }
  return doFlatten(genTargetLottieColor, immutable ? cloneDeep(lottieObj) : lottieObj);
};

const modifyColors = (colorsArray: any, lottieObj: any) => {
  let i = 0;
  function doModify(colors: any, obj: any) {
    if (obj.s && Array.isArray(obj.s) && obj.s.length === 4) {
      if (colors[i]) {
        obj.s = [...colors[i], 1];
      }
      i++;
    } else if (obj.c && obj.c.k) {
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] !== 'number') {
        doModify(colors, obj.c.k);
      } else {
        if (colors[i]) {
          obj.c.k = colors[i];
        }
        i++;
      }
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        doModify(colors, obj[key]);
      }
    }

    return obj;
  }
  return doModify(colorsArray, lottieObj);
};

const convertLottieColorToRgb = (lottieColor: number[]) => {
  return [Math.round(lottieColor[0] * 255), Math.round(lottieColor[1] * 255), Math.round(lottieColor[2] * 255)];
};

const convertLottieColorToRgba = (lottieColor: number[]) => {
  return [
    Math.round(lottieColor[0] * 255),
    Math.round(lottieColor[1] * 255),
    Math.round(lottieColor[2] * 255),
    lottieColor[3],
  ];
};

export const getColors = (lottieObj: any): any => {
  const res: any = [];
  function doGet(obj: any) {
    if (obj.s && Array.isArray(obj.s) && obj.s.length === 4) {
      if (obj.s[3] !== 1) {
        res.push(convertLottieColorToRgba(obj.s));
      } else {
        res.push(convertLottieColorToRgb(obj.s));
      }
    } else if (obj.c && obj.c.k) {
      if (Array.isArray(obj.c.k) && typeof obj.c.k[0] !== 'number') {
        doGet(obj.c.k);
      } else {
        if (obj.c.k.length === 4 && obj.c.k[3] !== 1) {
          res.push(convertLottieColorToRgba(obj.c.k));
        } else {
          res.push(convertLottieColorToRgb(obj.c.k));
        }
      }
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          doGet(obj[key]);
        }
      }
    }

    return res;
  }
  doGet(lottieObj);
  return res;
};
