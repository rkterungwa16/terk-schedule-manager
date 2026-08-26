import { render, screen } from '../../test/renderWithProviders';
import { Legend } from '../Legend';
import { DEFAULT_CATEGORIES } from '../../data/categories';

describe('Legend', () => {
  it('renders every default category from context', () => {
    render(<Legend />);
    for (const category of DEFAULT_CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it('paints each swatch with its category color', () => {
    render(<Legend />);
    const workEntry = screen.getByText('Work').parentElement;
    const swatch = workEntry?.querySelector('.entry-swatch');
    expect(swatch).toHaveStyle({ backgroundColor: '#d98e3c' });
  });
});
