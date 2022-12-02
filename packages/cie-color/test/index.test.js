beforeAll(() => {
});

beforeEach(() => {
  //jest.setTimeout(2000);
});

describe('default tests', () => {
  test(`self test`, (done) => {
    const received = 'OK';
    const expected = 'OK';
    expect(received).toEqual(expected);
    done();
  });
});