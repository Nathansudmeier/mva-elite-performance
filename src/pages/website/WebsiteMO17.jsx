import React from "react";
import WebsiteTeamPage from "./WebsiteTeamPage";
import { TIJDEN_STANDAARD } from "@/components/website/TrainingsTijdenBlok";

export default function WebsiteMO17() {
  return <WebsiteTeamPage teamNaam="MO17" playerTeamNaam="MO17" teamTitel="MO 17" accentKleur="#FF6800" competitie="Landelijke 1e Divisie" imageVeld="mo17_image_url" breadcrumb="SELECTIES / MO17" trainingstijden={TIJDEN_STANDAARD} />;
}