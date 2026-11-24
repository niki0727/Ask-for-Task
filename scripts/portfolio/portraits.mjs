// Additional edited photographs for a separate, unnamed portrait-work study.
const source = filename => `outputs/photography-showcase-20260923/drive-review/Portraits-Other/${filename}`;

export const portraitPhotos = [
  { key: 'portrait-other-rokh', slug: 'portrait-study-in-a-gallery-space', alt: 'Portrait study of a woman seated in a gallery space', filename: 'portrait-rokh.jpg' },
  { key: 'portrait-other-4725', slug: 'portrait-study-in-a-garden', alt: 'Portrait study of a woman in a garden', filename: 'NP1_4725.jpg' },
  { key: 'portrait-other-5838', slug: 'portrait-study-by-a-window', alt: 'Portrait study beside a sunlit window', filename: 'NP1_5838.jpg' },
  { key: 'portrait-other-6220', slug: 'portrait-study-in-dramatic-light', alt: 'Portrait study in dramatic light', filename: 'NP1_6220.jpg' },
].map(photo => ({ ...photo, sourcePath: source(photo.filename) }));
