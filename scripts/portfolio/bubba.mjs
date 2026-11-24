// Indoor Bubba Oasis photograph supplied through Nikita's shared Lightroom album.
const review = 'outputs/photography-showcase-20260923/drive-review/Bubba-Oasis-Indoor';

export const bubbaPhotos = [
  {
    key: 'bubba-indoor-couple',
    filename: 'bubba-indoor-couple.jpg',
    slug: 'couple-relaxing-inside-the-bubba-oasis-bar',
    alt: 'Couple relaxing together inside the Bubba Oasis bar',
  },
].map(photo => ({ ...photo, sourcePath: `${review}/${photo.filename}` }));
