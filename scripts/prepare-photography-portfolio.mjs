import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { refinePortfolio } from "./portfolio/refine.mjs";
import { vilniusPhotos } from "./portfolio/vilnius.mjs";
import { italianPhotos } from "./portfolio/italian.mjs";
import { buildImageSitemap } from "./portfolio/image-sitemap.mjs";

const root = process.cwd();
const source = path.join(root, "outputs/photography-showcase-20260923/catalogue-v15");
const destination = path.join(root, "public/portfolio");
const pages = [
  ["index.html", "London Photography Portfolio | Nikita Piazenko", "View London photographer Nikita Piazenko's selected event, portrait, food, hospitality, sport, aerial and commercial photography for brands and venues."],
  ["events.html", "London Event Photographer | Nikita Piazenko", "London event photography by Nikita Piazenko, covering people, venues, atmosphere and live moments for press, social media, digital use and campaigns."],
  ["hospitality.html", "London Food & Hospitality Photographer | Nikita Piazenko", "London food and hospitality photography by Nikita Piazenko, including dishes, drinks, interiors and atmosphere for menus, websites, social media and campaigns."],
  ["people.html", "London Portrait & Editorial Photographer | Nikita Piazenko", "London portrait and editorial photography by Nikita Piazenko, including natural portraits, fashion, magazine work, events and brand stories on location."],
  ["sport.html", "London Sport & Action Photographer | Nikita Piazenko", "Sport and action photography by London photographer Nikita Piazenko, capturing movement, competition and decisive moments for teams, events and stories."],
  ["aerial.html", "London Drone & Aerial Photographer | Nikita Piazenko", "London drone and aerial photography by Nikita Piazenko for property, places, landscapes and commercial projects, subject to location and permissions."],
  ["products.html", "London Product & Still Life Photographer | Nikita Piazenko", "London product and still life photography by Nikita Piazenko, focused on products, materials, light and detail for websites, campaigns and visual direction."],
  ["streets.html", "London Street & Place Photographer | Nikita Piazenko", "London street and place photography by Nikita Piazenko, capturing architecture, weather, movement and atmosphere with a clear editorial eye."],
  ["travel.html", "Travel & Landscape Photographer | Nikita Piazenko", "Travel and landscape photography by Nikita Piazenko, bringing together coastlines, cities, mountains and changing light in atmospheric visual stories."],
];

const visibleHeadings = {
  index: "London photography portfolio by Nikita Piazenko.",
  events: "London event photography.",
  hospitality: "London food & hospitality photography.",
  people: "London portrait & editorial photography.",
  sport: "Sport & action photography.",
  aerial: "London drone & aerial photography.",
  products: "London product & still life photography.",
  streets: "London street & place photography.",
  travel: "Travel & landscape photography.",
};

const visibleDecks = {
  index: "Events, hospitality, portraits, sport, places and aerial work, photographed and edited by Nikita Piazenko through A4T Studio.",
  events: "People, venues and atmosphere photographed by Nikita Piazenko across live events, launches and nightlife.",
  hospitality: "Food, drink, interiors and service photographed by Nikita Piazenko for restaurants, venues and hospitality brands.",
  people: "Natural portraits, editorial stories and commissioned people photography by Nikita Piazenko.",
  sport: "Movement, competition and decisive moments photographed by Nikita Piazenko for teams, events and visual stories.",
  aerial: "Aerial perspectives on London, property and place, photographed by Nikita Piazenko where location and permissions allow.",
  products: "Products, materials and considered still life photographed by Nikita Piazenko for digital, editorial and campaign use.",
  streets: "Architecture, movement and atmosphere observed by Nikita Piazenko across London and beyond.",
  travel: "Coastlines, cities, mountains and changing light photographed by Nikita Piazenko across international journeys.",
};

const statutory = "A4T Studio is the trading name of ASK FOR TASK LTD, registered in England and Wales under company number 14697408. Registered office: The Matilda House, St. Katharines Way, London, England, E1W 1LF.";
const footer = `<footer><div><span>Photography by Nikita Piazenko · A4T Studio</span><p>${statutory}</p></div><nav aria-label="Footer links"><a href="/photography/">Photography services</a><a href="/contact/?topic=Photography%20package">Discuss a shoot</a><a href="/safety/">Trust &amp; standards</a><a href="/privacy/">Privacy</a><a href="/cookies/">Cookies</a><a href="/faq/">FAQ</a><a href="/terms/">Terms</a></nav></footer>`;

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.join(destination, "images"), { recursive: true });
fs.copyFileSync(path.join(source, "style.css"), path.join(destination, "style.css"));
fs.copyFileSync(path.join(source, "gallery.js"), path.join(destination, "gallery.js"));
fs.cpSync(path.join(source, "images"), path.join(destination, "images"), { recursive: true });

for (const photo of [...vilniusPhotos, ...italianPhotos]) {
  const input = path.resolve(root, photo.sourcePath);
  if (!input.startsWith(`${root}${path.sep}`) || !fs.existsSync(input)) throw new Error(`Missing or unsafe Lightroom image: ${input}`);
  await sharp(input).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 84, effort: 5 })
    .toFile(path.join(destination, "images", `${photo.slug}.webp`));
  await sharp(input).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80, effort: 5 })
    .toFile(path.join(destination, "images", `${photo.slug}-small.webp`));
}

const cssPath = path.join(destination, "style.css");
fs.appendFileSync(cssPath, `\n/* Published portfolio focal positions; avoids inline style attributes under the site CSP. */\nimg[data-focal="50% 30%"] { object-position: 50% 30%; }\nimg[data-focal="50% 58%"] { object-position: 50% 58%; }\nimg[data-focal="70% 50%"] { object-position: 70% 50%; }\n`);

for (const [filename, title, description] of pages) {
  const sourceHtml = fs.readFileSync(path.join(source, filename), "utf8");
  const slug = filename.replace(/\.html$/, "");
  const route = filename === "index.html" ? "/portfolio/" : `/portfolio/${slug}/`;
  const escapedTitle = title.replaceAll("&", "&amp;");
  const escapedDescription = description.replaceAll("&", "&amp;");
  let html = sourceHtml
    .replace(/<meta name="robots" content="[^"]+">/, '<meta name="robots" content="index,follow,max-image-preview:large">')
    .replace(/<meta name="description" content="[^"]+">/, `<meta name="description" content="${escapedDescription}">`)
    .replace(/<title>[^<]+<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/<link rel="stylesheet" href="style\.css">/, '<link rel="stylesheet" href="/a4t-system.css"><link rel="stylesheet" href="/a4t-components.css"><link rel="stylesheet" href="/portfolio/style.css">')
    .replace(/<head>/, `<head><link rel="canonical" href="https://askfortask.co.uk${route}"><link rel="icon" href="/assets/a4t-mark-soft.svg" type="image/svg+xml"><meta property="og:title" content="${escapedTitle}"><meta property="og:description" content="${escapedDescription}"><meta property="og:type" content="website"><meta property="og:url" content="https://askfortask.co.uk${route}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapedTitle}"><meta name="twitter:description" content="${escapedDescription}">`)
    .replace(/<nav aria-label="Collections">/, '<nav aria-label="Collections"><a href="/">A4T Studio main site ↗</a>')
    .replace(/href="index\.html"/g, 'href="/photography/"')
    .replace(/href="(events|hospitality|people|sport|aerial|products|streets|travel|personal)\.html"/g, 'href="/portfolio/$1/"')
    .replaceAll("images/", "/portfolio/images/")
    .replace(/style="object-position:([^"]+)"/g, 'data-focal="$1"')
    .replace(/alt="" width=/g, 'alt="Photography collection preview" width=')
    .replace(/<img id="viewer-image" alt="">/, '<img id="viewer-image" alt="Photograph viewer" aria-hidden="true" width="1" height="1">')
    .replace(/<script src="gallery\.js" defer><\/script>/, '<script src="/portfolio/gallery.js" defer></script>')
    .replace(/<footer>[\s\S]*?<\/footer>/, footer)
    .replace(/<p class="deck">Coastal portraits, flash experiments and movement studies\.<\/p>/, '<p class="deck">Environmental portraits, movement, light and place developed through independent visual work.</p>');
  if (filename === "index.html") {
    html = html
      .replace('<p class="eyebrow">Nikita Piazenko / A4T Studio</p>', '<p class="eyebrow">Nikita Piazenko Photography</p>')
      .replace('<h1>Photography with a point of view.</h1>', `<h1>${visibleHeadings.index}</h1>`)
      .replace('Event coverage, food photography and portraits on location. Photography by Nikita Piazenko, available through A4T Studio.', visibleDecks.index);
  } else {
    html = html
      .replace(/<h1>[^<]+<\/h1>/, `<h1>${visibleHeadings[slug]}</h1>`)
      .replace(/<p class="deck">[^<]+<\/p>/, `<p class="deck">${visibleDecks[slug]}</p>`);
  }
  const pageDirectory = filename === "index.html" ? destination : path.join(destination, slug);
  fs.mkdirSync(pageDirectory, { recursive: true });
  fs.writeFileSync(path.join(pageDirectory, "index.html"), html);
}

await refinePortfolio(destination, source);
buildImageSitemap(root);
console.log(`Prepared ${pages.length} public portfolio pages at ${path.relative(root, destination)}.`);
