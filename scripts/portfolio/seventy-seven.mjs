// Edited originals supplied by Nikita for the 77 London · DEB FA event story.
const review = 'outputs/photography-showcase-20260923/drive-review/77-London-DEB-FA';

export const seventySevenPhotos = [
  { key: 'seventy-seven-027', filename: 'NP-27.jpg', slug: 'dj-framed-by-red-light-at-77-london', alt: 'DJ framed by red stage lighting at 77 London' },
  { key: 'seventy-seven-008', filename: 'NP-8.jpg', slug: 'dj-under-red-beams-at-77-london', alt: 'DJ at the decks beneath converging red lights at 77 London' },
  { key: 'seventy-seven-026', filename: 'NP-26.jpg', slug: 'guest-smiling-in-red-light-at-77-london', alt: 'Guest smiling in the red light at 77 London' },
  { key: 'seventy-seven-025', filename: 'NP-25.jpg', slug: 'crowd-facing-the-red-lit-dj-booth-at-77-london', alt: 'Crowd facing the DJ booth beneath red beams at 77 London' },
  { key: 'seventy-seven-046', filename: 'NP-46.jpg', slug: 'stage-and-dance-floor-in-violet-light-at-77-london', alt: 'Stage and dance floor under violet light at 77 London' },
  { key: 'seventy-seven-045', filename: 'NP-45.jpg', slug: 'dj-profile-in-blue-light-at-77-london', alt: 'DJ in profile beside the decks under blue light at 77 London' },
  { key: 'seventy-seven-037', filename: 'NP-37.jpg', slug: 'dj-at-the-mixer-at-77-london', alt: 'DJ working at the mixer in low light at 77 London' },
  { key: 'seventy-seven-048', filename: 'NP-48.jpg', slug: 'guests-talking-under-violet-lights-at-77-london', alt: 'Guests talking on the dance floor under violet lights at 77 London' },
  { key: 'seventy-seven-062', filename: 'NP-62.jpg', slug: 'dance-floor-in-blue-haze-at-77-london', alt: 'Dancers together on the floor in blue haze at 77 London' },
  { key: 'seventy-seven-044', filename: 'NP-44.jpg', slug: 'phone-raised-on-the-dance-floor-at-77-london', alt: 'Phone raised above the dance floor at 77 London' },
  { key: 'seventy-seven-059', filename: 'NP-59.jpg', slug: 'red-reflections-at-77-london', alt: 'Red reflections and a guest behind glass at 77 London' },
].map(photo => ({ ...photo, sourcePath: `${review}/${photo.filename}` }));
