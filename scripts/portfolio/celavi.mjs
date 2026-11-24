// Edited originals supplied by Nikita for the CE LA VI event and interiors stories.
const review = 'outputs/photography-showcase-20260923/drive-review/CE-LA-VI';

export const celaviPhotos = [
  { key: 'celavi-drive-006', filename: 'NP-6.jpg', slug: 'sunset-through-the-ce-la-vi-interior', alt: 'Sunset through the floor-to-ceiling windows of the CE LA VI interior' },
  { key: 'celavi-drive-027', filename: 'NP-27.jpg', slug: 'dj-working-at-the-decks-against-city-lights-at-ce-la-vi', alt: 'DJ working at the decks against the city lights at CE LA VI' },
  { key: 'celavi-drive-122', filename: 'NP-122.jpg', slug: 'guests-in-red-and-black-at-ce-la-vi', alt: 'Two guests posing together in red and black at CE LA VI' },
  { key: 'celavi-drive-130', filename: 'NP-130.jpg', slug: 'friends-sharing-a-phone-at-ce-la-vi', alt: 'Friends sharing a moment around a phone at CE LA VI' },
  { key: 'celavi-drive-4881', filename: 'NP1_4881.jpg', slug: 'backlit-wine-display-at-ce-la-vi', alt: 'Backlit wine display and mirrored lines inside CE LA VI' },
  { key: 'celavi-drive-116', filename: 'NP-116.jpg', slug: 'guest-dancing-in-gold-at-ce-la-vi', alt: 'Guest dancing in a gold dress at CE LA VI' },
  { key: 'celavi-drive-107', filename: 'NP-107.jpg', slug: 'friends-dancing-together-at-ce-la-vi', alt: 'Friends talking and dancing together at CE LA VI' },
  { key: 'celavi-drive-108', filename: 'NP-108.jpg', slug: 'dj-smiling-at-the-decks-at-ce-la-vi', alt: 'DJ smiling as he performs at CE LA VI' },
  { key: 'celavi-drive-105', filename: 'NP-105.jpg', slug: 'guest-dancing-under-red-light-at-ce-la-vi', alt: 'Guest dancing under red light at CE LA VI' },
  { key: 'celavi-drive-091', filename: 'NP-91.jpg', slug: 'dj-and-crowd-at-ce-la-vi', alt: 'DJ at the booth with hands raised in the crowd at CE LA VI' },
].map(photo => ({ ...photo, sourcePath: `${review}/${photo.filename}` }));
