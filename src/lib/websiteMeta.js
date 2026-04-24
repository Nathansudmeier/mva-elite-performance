// Centraal meta-tag beheer voor de publieke website (mv-artemis.nl)
// Wordt niet gebruikt door de interne app.

const PAGE_META = {
  "/": {
    title: "MV Artemis — Jouw Ambitie. Ons Doel.",
    description: "MV Artemis is de enige zelfstandige vrouwenvoetbalclub in Noord-Nederland. Prestatiegericht vrouwenvoetbal voor MO17, MO20 en Vrouwen 1. Gevestigd in Opeinde, Friesland.",
  },
  "/selecties": {
    title: "Selecties | MV Artemis",
    description: "Drie teams, één filosofie. MO17 in de jongenscompetitie, MO20 als schakel naar senioren en Vrouwen 1 als vlaggenschip. Bekijk de selecties van MV Artemis.",
  },
  "/mo17": {
    title: "MO17 | MV Artemis",
    description: "De MO17 van MV Artemis speelt in de Landelijke 1e Divisie. Jongenscompetitie, maximale intensiteit. Hier wordt talent gevormd dat elders niet gemaakt wordt.",
  },
  "/mo20": {
    title: "MO20 | MV Artemis",
    description: "De MO20 van MV Artemis is de schakel tussen jeugd en senioren. Consistentie onder druk, op weg naar Vrouwen 1.",
  },
  "/vrouwen-1": {
    title: "Vrouwen 1 | MV Artemis",
    description: "Vrouwen 1 is het vlaggenschip van MV Artemis. Kampioen 3e klasse, nu actief in de 2e klasse. Op koers richting de Topklasse.",
  },
  "/wedstrijden": {
    title: "Wedstrijden | MV Artemis",
    description: "Bekijk het wedstrijdprogramma en de uitslagen van alle MV Artemis teams. MO17, MO20 en Vrouwen 1.",
  },
  "/de-club": {
    title: "De Club | MV Artemis",
    description: "Leer MV Artemis kennen. Onze speelfilosofie, het trainers team en het verhaal achter de club. Opgericht in 2025 met één doel: meiden een volwaardige voetbalomgeving bieden.",
  },
  "/nieuws": {
    title: "Nieuws | MV Artemis",
    description: "Laatste nieuws, wedstrijdverslagen en updates van MV Artemis. Blijf op de hoogte van alles rondom de club.",
  },
  "/proeftraining": {
    title: "Proeftraining aanvragen | MV Artemis",
    description: "Wil jij bij MV Artemis komen voetballen? Meld je aan voor een proeftraining. MO17, MO20 of Vrouwen 1 — wij kijken of het klikt.",
  },
  "/contact": {
    title: "Contact | MV Artemis",
    description: "Neem contact op met MV Artemis. Voor vragen, samenwerkingen of sponsoring. Gevestigd op Sportpark Douwekamp in Opeinde, Friesland.",
  },
};

const DEFAULT_OG_IMAGE = "https://mv-artemis.nl/og-image.jpg";

function setMeta(name, content, useProperty = false) {
  if (!content) return;
  const attr = useProperty ? "property" : "name";
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export function applyWebsiteMeta({ title, description, ogImage, pathname } = {}) {
  const path = pathname || window.location.pathname;
  const url = "https://mv-artemis.nl" + path;

  // Fallback naar PAGE_META als title/description niet meegegeven zijn
  const fallback = PAGE_META[path] || PAGE_META["/"];
  const finalTitle = title || fallback.title;
  const finalDesc = description || fallback.description;
  const finalImage = ogImage || DEFAULT_OG_IMAGE;

  document.title = finalTitle;
  setMeta("description", finalDesc);
  setMeta("robots", "index, follow");
  setMeta("author", "MV Artemis");

  // Open Graph
  setMeta("og:site_name", "MV Artemis", true);
  setMeta("og:type", "website", true);
  setMeta("og:title", finalTitle, true);
  setMeta("og:description", finalDesc, true);
  setMeta("og:url", url, true);
  setMeta("og:image", finalImage, true);

  setCanonical(url);
}