import {roundMatrix} from '../src/ColorMatrix.js';
import * as RgbColorSpaces from '../src/RgbColorSpaces.js';
import {RgbSpace} from '../src/RgbSpace.js';
import {makeTransformMatrices} from '../src/ColorUtils.js';

const ColorSpaceMatrices = [
  {
    // IEC-61966-2-1
    // sample data: https://drafts.csswg.org/css-color-4/#color-conversion-code
    space: 'sRGB',
    digits: 15,
    toRgb: [
      [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
      [-0.9692436362808796, 1.875967501507721, 0.04155505740717559],
      [0.05563007969699366, -0.203976958888976, 1.056971514242878],
    ],
    toXyz: [
      [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
      [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
      [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
    ],
  },

  /*{
    // use it only to sow diff between wiki data and actual
    // IEC-61966-2-1 ??
    // sample data: https://en.wikipedia.org/wiki/SRGB
    space: 'sRGB',
    digits: 4,
    toRgb: [
      [3.2406, -1.5372, -0.4986],
      [-0.9689, 1.8758, 0.0415],
      [0.0557, -0.204, 1.057],
    ],
    toXyz: [
      [0.4124, 0.3576, 0.1805],
      [0.2126, 0.7152, 0.0722],
      [0.0193, 0.1192, 0.9505],
    ],
  },*/

  /*{
    // use it only to sow diff between old sRGB data and actual
    // IEC-61966-2-1 ??
    // https://color.org/chardata/rgb/sRGB.pdf
    space: 'sRGB',
    digits: 7,
    toRgb: [
      [3.2406255, -1.537208, -0.4986286],
      [-0.9689307, 1.8757561, 0.0415175],
      [0.0557101, -0.2040211, 1.0569959],
    ],
    toXyz: [
      [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
      [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
      [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
    ],
  },*/

  {
    // ASTM-E308
    // sample data https://en.wikipedia.org/wiki/Talk%3ASRGB (XYZ according to ASTM E308-01)
    space: 'sRGB',
    whitepoint: [0.95047, 1, 1.08883],
    digits: 15,
    toRgb: [
      [3.240454162114105, -1.537138512797716, -0.4985314095560162],
      [-0.9692660305051868, 1.876010845446694, 0.04155601753034984],
      [0.05564343095911469, -0.2040259135167539, 1.057225188223179],
    ],

    toXyz: [
      [0.4124564390896921, 0.357576077643909, 0.1804374832663989],
      [0.2126728514056225, 0.715152155287818, 0.07217499330655958],
      [0.01933389558232932, 0.119192025881303, 0.9503040785363677],
    ],
  },

  {
    // ASTM-E308
    // sample data http://www.brucelindbloom.com/Eqn_RGB_XYZ_Matrix.html
    space: 'sRGB',
    whitepoint: [0.95047, 1, 1.08883],
    digits: 8,
    toXyz: [
      [0.41245644, 0.35757608, 0.18043748],
      [0.21267285, 0.71515216, 0.07217499],
      [0.0193339, 0.11919203, 0.95030408],
    ],
    toRgb: [
      [3.24045416, -1.53713851, -0.49853141],
      [-0.96926603, 1.87601085, 0.04155602],
      [0.05564343, -0.20402591, 1.05722519],
    ],
  },

  // sample data: https://drafts.csswg.org/css-color-4/#color-conversion-code
  {
    space: 'a98RGB',
    digits: 15,
    toRgb: [
      [2.0415879038107465, -0.5650069742788596, -0.34473135077832956],
      [-0.9692436362808795, 1.8759675015077202, 0.04155505740717557],
      [0.013444280632031142, -0.11836239223101838, 1.0151749943912054],
    ],
    toXyz: [
      [0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
      [0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
      [0.02703136138641234, 0.07068885253582723, 0.9913375368376388],
    ],
  },

  // sample data: https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf
  {
    space: 'a98RGB',
    digits: 5,
    toRgb: [
      [2.04159, -0.56501, -0.34473],
      [-0.96924, 1.87597, 0.04156],
      [0.01344, -0.11836, 1.01517],
    ],
    toXyz: [
      [0.57667, 0.18556, 0.18823],
      [0.29734, 0.62736, 0.07529],
      [0.02703, 0.07069, 0.99134],
    ],
  },

  // sample data: https://drafts.csswg.org/css-color-4/#color-conversion-code
  {
    space: 'displayP3',
    digits: 15,
    toRgb: [
      [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
      [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
      [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
    ],
    toXyz: [
      [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
      [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
      [0.0, 0.04511338185890264, 1.043944368900976],
    ],
  },

  // sample data: https://drafts.csswg.org/css-color-4/#color-conversion-code
  {
    space: 'proPhoto',
    digits: 15,
    toRgb: [
      [1.3457989731028281, -0.25558010007997534, -0.05110628506753401],
      [-0.5446224939028347, 1.5082327413132781, 0.02053603239147973],
      [0.0, 0.0, 1.2119675456389454],
    ],
    toXyz: [
      [0.7977604896723027, 0.13518583717574031, 0.0313493495815248],
      [0.2880711282292934, 0.7118432178101014, 0.00008565396060525902],
      [0.0, 0.0, 0.8251046025104601],
    ],
  },

  // sample data: https://drafts.csswg.org/css-color-4/#color-conversion-code
  {
    space: 'rec2020',
    digits: 14,
    toRgb: [
      [1.7166511879712674, -0.35567078377639233, -0.25336628137365974],
      [-0.6666843518324892, 1.6164812366349395, 0.01576854581391113],
      [0.017639857445310783, -0.042770613257808524, 0.9421031212354738],
    ],
    toXyz: [
      [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
      [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
      [0.0, 0.028072693049087428, 1.060985057710791],
    ],
  },
];

describe('makeTransformMatrices', () => {
  ColorSpaceMatrices.map((item) => {
    const { space, method, digits, toRgb, toXyz } = item;
    test(`RGB space: ${space}`, () => {
      //const whitepoint = Color.getWhitepoint(this.illuminant, 2, method);
      const expected = { toRgb: roundMatrix(toRgb, digits), toXyz: roundMatrix(toXyz, digits) };
      const { primary } = RgbColorSpaces[space];
      const whitepoint = item.whitepoint ? item.whitepoint : RgbColorSpaces[space].whitepoint;
      const result = makeTransformMatrices(primary, whitepoint, digits);
      expect(result).toEqual(expected);
    });
  });
});