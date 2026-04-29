import React from "react";
import WebsiteTeamPage from "./WebsiteTeamPage";
import { TIJDEN_STANDAARD } from "@/components/website/TrainingsTijdenBlok";

export default function WebsiteVrouwen1() {
  return <WebsiteTeamPage teamNaam="Vrouwen 1" playerTeamNaam="VR1" teamTitel={"VROUWEN\n1"} accentKleur="#FF6800" competitie="3e Klasse" imageVeld="vrouwen1_image_url" breadcrumb="SELECTIES / VROUWEN 1" trainingstijden={TIJDEN_STANDAARD} />;
}