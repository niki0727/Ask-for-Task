// Additional photographs from Nikita's published FashionTV event sequence.
const source = number => `outputs/photography-showcase-20260923/adobe-review-v6/events/${number}.jpg`;
const driveSource = number => `outputs/photography-showcase-20260923/drive-review/FashionTV/NP-${number}.jpg`;

export const fashionPhotos = [
  { key: 'fashion-design-007', number: '007', slug: 'golden-bar-and-fashiontv-screen-at-the-event', alt: 'Golden-lit bar and FashionTV screen set the atmosphere for the event' },
  { key: 'fashion-guests-011', number: '011', slug: 'guests-conversing-in-the-red-fashiontv-lounge', alt: 'Guests talking in the red-lit FashionTV lounge' },
  { key: 'fashion-drive-068', number: '068', slug: 'fashiontv-dj-with-microphone-in-the-foreground', alt: 'DJ at the red FashionTV booth with a microphone in the foreground', sourcePath: driveSource('68') },
  { key: 'fashion-drive-039', number: '039', slug: 'guests-in-pastel-fashion-at-the-fashiontv-event', alt: 'Guests in pastel fashion talking inside the FashionTV event venue', sourcePath: driveSource('39') },
  { key: 'fashion-drive-053', number: '053', slug: 'fashiontv-branded-bags-by-the-red-bar', alt: 'FashionTV branded bags and flowers beside the red bar', sourcePath: driveSource('53') },
  { key: 'fashion-drive-033', number: '033', slug: 'red-velvet-seating-and-sculptural-lighting-at-fashiontv', alt: 'Red velvet seating and sculptural glass lights inside the FashionTV venue', sourcePath: driveSource('33') },
  { key: 'fashion-drive-052', number: '052', slug: 'fashiontv-ice-sculpture-and-red-venue-design', alt: 'Illuminated ice sculpture against the red FashionTV venue design', sourcePath: driveSource('52') },
  { key: 'fashion-venue-amber', number: 'amber-lounge', slug: 'amber-lit-fashiontv-lounge-and-artwork', alt: 'Amber-lit FashionTV lounge with artworks, guests and intimate table lighting', sourcePath: 'outputs/photography-showcase-20260923/drive-review/FashionTV/fashiontv-amber-lounge.png' },
  { key: 'fashion-venue-red', number: 'red-lounge', slug: 'red-fashiontv-lounge-and-velvet-seating', alt: 'Red FashionTV lounge with velvet seating and warm table lights', sourcePath: 'outputs/photography-showcase-20260923/drive-review/FashionTV/fashiontv-red-lounge.png' },
].map(photo => ({ ...photo, sourcePath: photo.sourcePath || source(photo.number) }));
