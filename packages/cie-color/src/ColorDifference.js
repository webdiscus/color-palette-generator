/**
 * Color difference Delta E
 * @see https://wisotop.de/assets/2017/DeltaE-%20Survey-2.pdf
 */

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

/**
 * Convert Lab components a,b to hue.
 *
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
const labToHue = (a, b) => {
  if (1e-6 > Math.abs(a) && 1e-6 > Math.abs(b)) return 0;
  // note: the order of arguments must be atan2(b, a)
  const deg = Math.atan2(b, a) * RAD2DEG;
  return 0 > deg ? deg + 360 : deg;
};

/**
 * Calculates the color difference (Delta E) using the CIEDE1976 algorithm.
 * @see http://www.brucelindbloom.com/Eqn_DeltaE_CIE76.html
 *
 * @param {Lab} lab1 The reference color.
 * @param {Lab} lab2 The sample color.
 * @returns {number}
 */
const deltaE1976 = function (lab1, lab2) {
  return Math.sqrt(Math.pow(lab1.L - lab2.L, 2) + Math.pow(lab1.a - lab2.a, 2) + Math.pow(lab1.b - lab2.b, 2));
};

/**
 * Calculates the color difference (Delta E) using the CIEDE1994 algorithm.
 * @see http://www.brucelindbloom.com/Eqn_DeltaE_CIE94.html
 *
 * @param {Lab} lab1 The reference color.
 * @param {Lab} lab2 The sample color.
 * @param {boolean} isTextiles When is true then used constants for textiles,
 *   when false then used constants for graphic arts.
 * @returns {number}
 */
const deltaE1994 = function (lab1, lab2, isTextiles = true) {
  const { kL, k1, k2 } = isTextiles ? { kL: 2, k1: 0.048, k2: 0.014 } : { kL: 1, k1: 0.045, k2: 0.015 },
    // components of CIEDE1994 deltaE formula
    C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b),
    C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b),
    da = lab1.a - lab2.a,
    db = lab1.b - lab2.b,
    dL = lab1.L - lab2.L,
    dC = C1 - C2,
    dH = Math.sqrt(da * da + db * db - dC * dC),
    sL = 1,
    sC = 1 + k1 * C1,
    sH = 1 + k2 * C1;

  return Math.sqrt(Math.pow(dL / (kL * sL), 2) + Math.pow(dC / sC, 2) + Math.pow(dH / sH, 2));
};

/**
 * Calculates the color difference (Delta E or dE00) using the CIEDE2000 algorithm.
 * It is implemented according to the standard CIEDE2000 colour-difference formula (ISO/CIE 11664-6:2014).
 *
 * References:
 * - BSI Standards Publication ISO/CIE 11664-6:2014(E), ISBN 978 0 580 82701 3
 * - https://en.wikipedia.org/wiki/Color_difference
 * - http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf
 * - https://www.color.org/events/colorimetry/Melgosa_CIEDE2000_Workshop-July4.pdf
 *
 * Achtung:
 * The formula by Bruce Lindbloom has error at http://www.brucelindbloom.com/Eqn_DeltaE_CIE2000.html (14).
 * The correct calc of mean hue is at http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf, p.22, (14).
 * For example, the values Lab1 = [100, 0, 10], Lab2 = [100, 0.1, -127.5]
 * has the correct dE = 45.69699725982907 (using formula G. Sharma),
 * but using Bruce Lindbloom formula dE = 45.69720390481548. It is wrong, because on the step (14) the avg h' is > 360.
 *
 * @note The difference between Color A and Color B may not be the same as the difference between Color B and Color A.
 *
 * @description The parametric factors kL = kC = kH = 1 under conditions:
 * - Illumination: source simulating the relative spectral irradiance of CIE Standard Illuminant D65.
 * - Illuminance: 1000 lx.
 * - Observer: normal color vision.
 * - Background field: uniform, neutral gray with L*=50.
 * - Viewing mode: object.
 * - Sample size: sample pair subtending a visual angle greater than 4 degrees.
 * - Sample separation: minimum sample separation achieved by placing the sample pair in direct edge contact.
 * - Sample color-difference magnitude: 0 to 5 CIELAB units.
 * - Sample structure: homogeneous colour without visually apparent pattern or non-uniformity.
 *
 * Definitions, Symbols and Abbreviations
 * <pre>
 * General formula definitions.
 *
 * LCh difference.
 * dL (∆L′) - CIEDE2000 lightness difference
 * dC (∆C′) - CIEDE2000 chroma difference
 * dH (∆H′) - CIEDE2000 hue difference
 *
 * Weighting Functions. Positional corrections to the lack of uniformity of CIELAB.
 * RT - hue rotation function is need to correct blue tones near 275 degrees
 * sL - lightness weighting function (crispening effect)
 * sC - chroma weighting function, proposed by CIE94
 * sH - hue weighting function
 *
 * Parametric Factors. Corrections accounting for the influence of experimental viewing conditions.
 * kL - lightness parametric factor
 * kC - chroma parametric factor
 * kH - hue parametric factor
 *
 * Definitions used in the calculation steps.
 *
 * k25Pow7 - 25^7
 * isLowChroma - whether a chroma value is to low, near by 0,
 *               see http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf (10) (14)
 *
 * L1, L2 (L*) - CIELAB lightness
 * a1,a2, b1,b2 (a*), (b*) - CIELAB a*,b* coordinates
 * avgLightness (avg L′) - arithmetic mean of the CIELAB lightnesses of two colour stimuli
 * chroma1, chroma12 (C*) - CIELAB chroma
 *
 * G - switching function used in the modification of a*
 * a1Prime, a1Prime (a′) - CIEDE2000 modified a* coordinate
 * chroma1Prime, chroma2Prime (C′) - CIEDE2000 modified chroma
 * avgChromaPrime (avg C′) - arithmetic mean of the CIEDE2000 chromas of two colour stimuli
 * hue1, hue2 (h′) - CIEDE2000 modified hue angle
 *
 * dHueAngle (∆h′) - CIEDE2000 hue-angle difference
 * avgHueAngle (avg h′) - arithmetic mean of the CIEDE2000 hue angles of two colour stimuli
 *
 * T - T-function for hue weighting
 * dTheta (∆θ) - hue dependence of rotation function
 * RC - chroma dependence of rotation function
 *
 * </pre>
 *
 * @param {Lab} lab1 The reference color, in Lab color space.
 * @param {Lab} lab2 The sample color, in Lab color space.
 * @param {number} [kL=1] The lightness parametric factor. In textile industry kL = 2.0
 * @param {number} [kC=1] The chroma parametric factor.
 * @param {number} [kH=1] The hue parametric factor.
 *
 * @returns {number} The delta E of two Lab colors.
 */
const deltaE2000 = function (lab1, lab2, kL = 1, kC = 1, kH = 1) {
  const k25Pow7 = 6103515625,
    { L: L1, a: a1, b: b1 } = lab1,
    { L: L2, a: a2, b: b2 } = lab2;

  // 1. Calculate dL, sL for general formula.
  const avgLightness = (L1 + L2) / 2,
    avgLightnessMinus50Pow2 = Math.pow(avgLightness - 50, 2),
    dL = L2 - L1,
    sL = 1 + (0.015 * avgLightnessMinus50Pow2) / Math.sqrt(20 + avgLightnessMinus50Pow2);

  // 2. Calculate dC, sC for general formula.
  const // Lab to chroma
    chroma1 = Math.sqrt(a1 * a1 + b1 * b1),
    chroma2 = Math.sqrt(a2 * a2 + b2 * b2),
    isLowChroma = 1e-4 > Math.abs(chroma1) || 1e-4 > Math.abs(chroma2),
    avgChroma = (chroma1 + chroma2) / 2,
    // note: Math.pow(x, 7) or (x ** 7) is in Chrome 50% slower than 7x multiplications
    avgChromaPow7 = avgChroma * avgChroma * avgChroma * avgChroma * avgChroma * avgChroma * avgChroma,
    G = (1 - Math.sqrt(avgChromaPow7 / (avgChromaPow7 + k25Pow7))) / 2,
    //
    a1Prime = a1 * (1 + G),
    a2Prime = a2 * (1 + G),
    chroma1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1),
    chroma2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2),
    avgChromaPrime = (chroma1Prime + chroma2Prime) / 2,
    dC = chroma2Prime - chroma1Prime,
    sC = 1 + 0.045 * avgChromaPrime;

  // 3. Calculate dH, sH for general formula.
  const // hue1, hue1 are in range [0, 360]
    hue1 = labToHue(a1Prime, b1),
    hue2 = labToHue(a2Prime, b2),
    diffHue = hue2 - hue1,
    sumHue = hue1 + hue2;

  let dHueDeg = 0,
    avgHueDeg = sumHue;

  if (!isLowChroma) {
    // see http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf, p.22, (10)
    dHueDeg = diffHue > 180 ? diffHue - 360 : diffHue < -180 ? diffHue + 360 : diffHue;
    // see http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf, p.22, (14)
    avgHueDeg = Math.abs(diffHue) <= 180 ? sumHue / 2 : sumHue < 360 ? (sumHue + 360) / 2 : (sumHue - 360) / 2;
  }

  const T =
      1 -
      0.17 * Math.cos((avgHueDeg - 30) * DEG2RAD) +
      0.24 * Math.cos(2 * avgHueDeg * DEG2RAD) +
      0.32 * Math.cos((3 * avgHueDeg + 6) * DEG2RAD) -
      0.2 * Math.cos((4 * avgHueDeg - 63) * DEG2RAD),
    dH = 2 * Math.sqrt(chroma1Prime * chroma2Prime) * Math.sin((dHueDeg * DEG2RAD) / 2),
    sH = 1 + 0.015 * avgChromaPrime * T;

  // 4. Calculate RT for general formula.
  const // note: Math.pow(x, 7) or (x ** 7) is in Chrome 50% slower than 7x multiplications
    avgChromaPrimePow7 =
      avgChromaPrime *
      avgChromaPrime *
      avgChromaPrime *
      avgChromaPrime *
      avgChromaPrime *
      avgChromaPrime *
      avgChromaPrime,
    dTheta = 30 * Math.exp(-Math.pow((avgHueDeg - 275) / 25, 2)),
    RC = 2 * Math.sqrt(avgChromaPrimePow7 / (avgChromaPrimePow7 + k25Pow7)),
    RT = -RC * Math.sin(2 * dTheta * DEG2RAD);

  // 5. Calculate general formula of CIEDE2000 Color-Difference dE00.
  return Math.sqrt(
    // 1.
    Math.pow(dL / (kL * sL), 2) +
      // 2.
      Math.pow(dC / (kC * sC), 2) +
      // 3.
      Math.pow(dH / (kH * sH), 2) +
      // 4.
      RT * (dC / (kC * sC)) * (dH / (kH * sH))
  );
};

/**
 * Calculates the color difference (Delta E) using the CMC algorithm.
 * @see https://en.wikipedia.org/wiki/Color_difference
 *
 * @param {Lab} lab1 The reference color.
 * @param {Lab} lab2 The sample color.
 * @param {number} l The lightness weighting factor (1 or 2), defaults 2.
 * @param {number} c The chroma weighting factor, defaults 1.
 * @returns {number}
 */
const deltaECMC = function (lab1, lab2, l = 2, c = 1) {
  const { L: L1, a: a1, b: b1 } = lab1,
    { L: L2, a: a2, b: b2 } = lab2,
    C1 = Math.sqrt(a1 * a1 + b1 * b1),
    C2 = Math.sqrt(a2 * a2 + b2 * b2),
    da = a1 - a2,
    db = b1 - b2,
    // calc dL, dC, dH
    dL = L1 - L2,
    dC = C1 - C2,
    dH = Math.sqrt(da * da + db * db - dC * dC),
    H1 = labToHue(a1, b1),
    T =
      164 <= H1 && H1 <= 345
        ? 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * DEG2RAD))
        : 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * DEG2RAD)),
    C1Pow4 = C1 * C1 * C1 * C1,
    F = Math.sqrt(C1Pow4 / (1900 + C1Pow4)),
    // calc sL, sC, sH
    sL = L1 < 16 ? 0.511 : (0.040975 * L1) / (1 + 0.01765 * L1),
    sC = 0.638 + (0.0638 * C1) / (1 + 0.0131 * C1),
    sH = sC * (F * T + 1 - F);

  return Math.sqrt(
    // 1.
    Math.pow(dL / (l * sL), 2) +
      // 2.
      Math.pow(dC / (c * sC), 2) +
      // 3.
      Math.pow(dH / sH, 2)
  );
};

export { deltaE1976, deltaE1994, deltaE2000, deltaECMC };
