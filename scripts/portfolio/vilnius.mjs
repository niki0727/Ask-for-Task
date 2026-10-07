// District boat → Gallery 1986. Original camera filenames were checked against
// Lightroom's Info panel; sourcePath files are its edited shared renditions.
const lightroomSource = 'outputs/photography-selection-20260922/district29-contact-sheets/source';
const editedSource = 'outputs/photography-showcase-20260923/edited-vilnius-20261006';
const shared = (number, original, slug, alt, chapter) => ({
  key: `vilnius-${original.match(/\d+/g).at(-1)}`,
  original,
  sourcePath: `${lightroomSource}/district29-${String(number).padStart(3, '0')}.jpg`,
  slug,
  alt,
  chapter,
  provenance: 'Edited Lightroom shared rendition; original camera filename verified in the District 29 album',
});

export const vilniusPhotos = [
  shared(17, 'NP1_7118.NEF', 'district-boat-crowd-under-bridge-vilnius', 'Crowd and DJ lights aboard the District boat beneath a Vilnius bridge at dusk', 'District boat'),
  shared(59, 'NP1_7711.NEF', 'district-boat-friends-dancing-vilnius', 'Friends dancing together in red light aboard the District boat in Vilnius', 'District boat'),
  {
    key: 'vilnius-7852', original: 'NP1_7852.NEF',
    sourcePath: `${editedSource}/NP1_7852.jpg`,
    slug: 'district-boat-dj-under-red-light-vilnius',
    alt: 'DJ performing beneath warm red light aboard the District boat in Vilnius',
    chapter: 'District boat', provenance: 'Full-size edited JPEG export',
  },
  shared(60, 'NP1_7685.NEF', 'district-boat-red-lit-guest-vilnius', 'Guest under red light against the blue night during the District boat event in Vilnius', 'District boat'),
  shared(82, 'NP1_7939.NEF', 'district-boat-dancer-red-light-vilnius', 'Dancer with raised arms beneath red lights at the District boat event in Vilnius', 'District boat'),
  shared(122, 'NP1_8262.NEF', 'gallery-1986-doorway-and-crowd-vilnius', 'View through the Gallery 1986 doorway to the crowd and coloured lights in Vilnius', 'Gallery 1986'),
  shared(128, 'NP1_8308.NEF', 'gallery-1986-crowd-behind-dj-vilnius', 'Crowd seen from behind the DJ desk beneath the orange ceiling at Gallery 1986', 'Gallery 1986'),
  shared(150, 'NP1_8821.NEF', 'gallery-1986-room-and-crowd-vilnius', 'Wide view of the Gallery 1986 room and crowd beneath a glowing ceiling installation', 'Gallery 1986'),
  shared(99, 'NP1_8169.NEF', 'gallery-1986-pink-blue-lights-vilnius', 'Pink and blue suspended lights above the Gallery 1986 crowd in Vilnius', 'Gallery 1986'),
  shared(91, 'NP1_8070.NEF', 'gallery-1986-dancer-blue-light-vilnius', 'Dancer moving through blue light at Gallery 1986 in Vilnius', 'Gallery 1986'),
  shared(104, 'NP1_8199.NEF', 'gallery-1986-friends-vilnius', 'Three friends sharing a moment in the red seating area at Gallery 1986', 'Gallery 1986'),
  shared(108, 'NP1_8215.NEF', 'gallery-1986-tattoo-detail-vilnius', 'Intimate tattoo moment in low light during the Gallery 1986 event', 'Gallery 1986'),
  shared(148, 'NP1_8819.NEF', 'gallery-1986-djs-vilnius', 'DJs performing under coloured light at Gallery 1986 in Vilnius', 'Gallery 1986'),
  shared(147, 'NP1_8504.NEF', 'gallery-1986-guests-and-bubbles-vilnius', 'Two guests together in red light and bubbles at Gallery 1986', 'Gallery 1986'),
  shared(159, 'NP1_8714.NEF', 'gallery-1986-guest-portrait-vilnius', 'Guest looking toward the lights at Gallery 1986 in Vilnius', 'Gallery 1986'),
  {
    key: 'vilnius-8364', original: 'NP1_8364.NEF',
    sourcePath: `${editedSource}/NP1_8364.jpg`,
    slug: 'red-lit-dance-floor-gallery-1986-vilnius',
    alt: 'Crowd and red stage lights during the District and Gallery 1986 nightlife event in Vilnius',
    chapter: 'Gallery 1986', provenance: 'Full-size edited JPEG export',
  },
  shared(160, 'NP1_8724.NEF', 'gallery-1986-woman-in-music-vilnius', 'Guest immersed in the music and warm red light at Gallery 1986', 'Gallery 1986'),
];
