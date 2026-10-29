// All website photos in one place (free photos from Unsplash, loaded from their CDN).
// To work offline in the presentation, save the photos into /public/images
// and change these values to '/images/hero-1.jpg' and so on.
const photo = (id, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const images = {
  // Hero slider.
  heroJump: photo('1574695272842-52dfdb7989d0'), // Horse jumping over an obstacle.
  heroWhite: photo('1553284965-83fd3e82fa5a'), // Running white horse.
  heroRider: photo('1511746687876-42cb762f6ac1'), // Woman riding near trees.

  // "About us" cards.
  lessons: photo('1600757490188-1eb2bab4cf4a', 900), // Woman riding a brown horse.
  tournaments: photo('1695133994223-02698c56f100', 900), // Rider jumping an obstacle.
  horses: photo('1593179449458-e0d43d512551', 900), // Brown horse with a halter.

  // "Meet our horses" gallery.
  gallery: [
    photo('1598974357801-cbca100e65d3', 700), // Brown and white horse head.
    photo('1557374800-8ba4ccd60e9d', 700), // Brown horse.
    photo('1553284965-fa61e9ad4795', 700), // White horse in a forest.
    photo('1603989888581-3115416784fa', 700), // Brown horse in a field.
  ],

  // Closing banner and auth pages.
  sunset: photo('1598362042346-70c59713811f'), // Horses at sunset.
  authPhoto: photo('1601726429844-acd8b1385972', 1200), // Black and white horse head.

  // Banners at the top of inner pages.
  headerLessons: photo('1532876075969-8c016daf9242'), // Person riding.
  headerTournaments: photo('1695133996154-e09d82de12b9'), // Jumping an obstacle.
  headerAccount: photo('1594768816441-1dd241ffaa67'), // Rider in a helmet.
  headerAdmin: photo('1494984858525-798dd0b282f5'), // Group of horses.
};

// One photo per skill level, for the lesson cards.
export const skillImages = {
  BEGINNER: photo('1698653223457-05e00ad9cec2', 800), // Young girl on a horse.
  INTERMEDIATE: photo('1600757490188-1eb2bab4cf4a', 800), // Woman riding.
  ADVANCED: photo('1574695272842-52dfdb7989d0', 800), // Jumping.
};

// One photo per tournament type, for the tournament cards.
const jump = photo('1695133994223-02698c56f100', 900);
export const tournamentImages = {
  SHOW_JUMPING: jump,
  EVENTING: photo('1593353817812-a798ed84305c', 900),
  DRESSAGE: photo('1550785330-003a9afa3bd9', 900),
  SHOWING: photo('1598974357801-cbca100e65d3', 900),
  POLO: photo('1546700990-7b6416f2d90c', 900),
  RACING: photo('1553284965-5dd8352ff1bd', 900),
  VAULTING: photo('1613085411234-9c83af5562d8', 900),
  REINING: photo('1600715151005-e6d44b9ef840', 900),
  ENDURANCE: photo('1589400867230-3491ceee2934', 900),
};

// Photos used for horses that have no uploaded picture.
export const horseFallbackImages = [
  photo('1598974357801-cbca100e65d3', 500),
  photo('1557374800-8ba4ccd60e9d', 500),
  photo('1553284965-fa61e9ad4795', 500),
  photo('1603989888581-3115416784fa', 500),
  photo('1593179449458-e0d43d512551', 500),
];

export default images;
