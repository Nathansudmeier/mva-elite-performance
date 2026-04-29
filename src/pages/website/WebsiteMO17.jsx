import React from "react";
import WebsiteTeamPage from "./WebsiteTeamPage";

const MO17_TRAININGSTIJDEN = [
  { dag: "Maandag", tijd: "18:45 – 20:15", omschrijving: "Loop- & performancetraining (eerste blok)" },
  { dag: "Woensdag", tijd: "19:30 – 21:00", omschrijving: null },
  { dag: "Vrijdag", tijd: "18:30 – 20:00", omschrijving: null },
];

export default function WebsiteMO17() {
  return <WebsiteTeamPage teamNaam="MO17" playerTeamNaam="MO17" teamTitel="MO 17" accentKleur="#FF6800" competitie="Landelijke 1e Divisie" imageVeld="mo17_image_url" breadcrumb="SELECTIES / MO17" trainingstijden={MO17_TRAININGSTIJDEN} />;
}