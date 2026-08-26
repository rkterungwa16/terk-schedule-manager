import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORIES, getCategory } from '../categories';

describe('DEFAULT_CATEGORIES', () => {
  it('has a unique id for each category', () => {
    const ids = DEFAULT_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every default category a color drawn from the shared palette', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(CATEGORY_COLOR_PALETTE).toContain(category.color);
    }
  });
});

describe('getCategory', () => {
  it('finds a category by id', () => {
    const result = getCategory(DEFAULT_CATEGORIES, 'work');
    expect(result.name).toBe('Work');
  });

  it('falls back to a neutral placeholder for an unknown id, rather than throwing', () => {
    const result = getCategory(DEFAULT_CATEGORIES, 'does-not-exist');
    expect(result).toEqual({ id: 'does-not-exist', name: 'Unknown', color: '#888888' });
  });
});
