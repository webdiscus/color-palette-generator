// only for compare values between IEC 61966-2-1 standard (calculated from xy)
// and ASTM-E308 standards (calculated from wavelength)
// import {Chromaticity, Illuminant} from '../src/data/Illuminant.js';
// import Color from '../src/Color.js';
// import {roundFloat} from '../lib/math/index.js';
//
// TODO: research correct values for Chromaticity and Illuminant
// describe('Chromaticity to Illuminant (observer 2°)', () => {
//   const observer = 2;
//   const chromaticity = Chromaticity[observer];
//   const digits = 4;
//
//   for (let name in chromaticity) {
//     const [x, y] = chromaticity[name];
//     test(`${name} ${x},${y}`, () => {
//       const [X, Y, Z] = Color.getWhitepoint({ illuminant: name, observer: observer });
//       const result = [roundFloat(X, digits), Y, roundFloat(Z, digits)];
//       const expected = Illuminant[observer][name];
//       expect(result).toEqual(expected);
//     });
//   }
// });

describe('dummy tests', () => {
  test(`self test`, (done) => {
    const received = 'OK';
    const expected = 'OK';
    expect(received).toEqual(expected);
    done();
  });
});