// Edited Adobe Portfolio JPEGs already held in the private review archive.
const source = number => `outputs/photography-showcase-20260923/adobe-review-v6/food/${number}.jpg`;

export const italianPhotos = [
  { key: 'italian-017', number: '017', slug: 'margherita-pizza-served-at-bocca-in-cielo', alt: 'Freshly served margherita pizza at Bocca in Cielo' },
  { key: 'italian-020', number: '020', slug: 'pizza-with-olives-against-a-brick-wall-at-bocca-in-cielo', alt: 'Pizza with olives against the brick wall at Bocca in Cielo' },
  { key: 'italian-021', number: '021', slug: 'hand-lifting-a-slice-of-olive-pizza-at-bocca-in-cielo', alt: 'Hand lifting a slice of olive pizza at Bocca in Cielo' },
  { key: 'italian-022', number: '022', slug: 'folded-calzone-with-salad-at-bocca-in-cielo', alt: 'Folded calzone served with salad at Bocca in Cielo' },
  { key: 'italian-023', number: '023', slug: 'calzone-and-salad-at-bocca-in-cielo', alt: 'Guest cutting into a calzone beside a salad at Bocca in Cielo' },
  { key: 'italian-024', number: '024', slug: 'wine-bottles-in-the-warm-interior-at-bocca-in-cielo', alt: 'Wine bottles and warm lighting inside Bocca in Cielo' },
  { key: 'italian-028', number: '028', slug: 'bruschetta-on-dark-slate-at-mare-fabris-osteria', alt: 'Bruschetta served on dark slate at Mare Fabris Osteria' },
  { key: 'italian-030', number: '030', slug: 'plated-seafood-and-vegetables-at-mare-fabris-osteria', alt: 'Seafood and vegetables plated at Mare Fabris Osteria' },
  { key: 'italian-034', number: '034', slug: 'mussels-with-white-wine-at-mare-fabris-osteria', alt: 'Mussels and a glass of white wine at Mare Fabris Osteria' },
  { key: 'italian-036', number: '036', slug: 'sliced-steak-overhead-at-mare-fabris-osteria', alt: 'Sliced steak photographed from above at Mare Fabris Osteria' },
  { key: 'italian-037', number: '037', slug: 'steak-with-red-wine-at-mare-fabris-osteria', alt: 'Steak and red wine against a green doorway at Mare Fabris Osteria' },
].map(photo => ({ ...photo, sourcePath: source(photo.number) }));
