const mockCheerio = {
  load: jest.fn((html: string) => {
    const $ = function (selector: string) {
      return {
        each: jest.fn(),
        unwrap: jest.fn(),
        removeAttr: jest.fn(),
        html: jest.fn(),
        find: jest.fn(() => ({
          html: jest.fn(),
        })),
        attr: jest.fn(),
        wrap: jest.fn(),
        addClass: jest.fn(),
        text: jest.fn(() => ''),
        first: jest.fn(() => ({
          text: jest.fn(() => ''),
        })),
      };
    };
    $.html = jest.fn(() => html);
    $.text = jest.fn(() => '');
    return $;
  }),
};

export default mockCheerio;
