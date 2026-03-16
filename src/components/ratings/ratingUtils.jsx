export const CATEGORIES = {
  Technisch: [
    { key: "pass_kort", label: "Pass kort" },
    { key: "pass_lang", label: "Pass lang" },
    { key: "koppen", label: "Koppen" },
    { key: "scorend_vermogen", label: "Scorend vermogen" },
    { key: "duel_aanvallend", label: "Duel 1:1 aanvallend" },
    { key: "duel_verdedigend", label: "Duel 1:1 verdedigend" },
    { key: "balaanname", label: "Balaanname" },
  ],
  Inzicht: [
    { key: "speelveld_groot", label: "Speelveld groot maken bij balbezit" },
    { key: "omschakeling_balverlies", label: "Omschakeling balverlies → balbezit" },
    { key: "speelveld_klein", label: "Speelveld klein maken bij balbezit tegenstander" },
    { key: "omschakeling_balbezit", label: "Omschakeling balbezit → balverlies" },
    { key: "kijkgedrag", label: "Kijkgedrag" },
  ],
  Persoonlijkheid: [
    { key: "winnaarsmentaliteit", label: "Winnaarsmentaliteit" },
    { key: "leergierig", label: "Leergierig" },
    { key: "opkomst_trainingen", label: "Opkomst trainingen" },
    { key: "komt_afspraken_na", label: "Komt afspraken na" },
    { key: "doorzetter", label: "Doorzetter" },
  ],
  Fysiek: [
    { key: "startsnelheid", label: "Startsnelheid" },
    { key: "snelheid_lang", label: "Snelheid lange afstand" },
    { key: "postuur", label: "Postuur" },
    { key: "blessuregevoeligheid", label: "Blessuregevoeligheid" },
    { key: "duelkracht", label: "Duelkracht" },
    { key: "motorische_vaardigheden", label: "Motorische vaardigheden" },
  ],
};

export function calcCategoryAverages(rating) {
  const result = {};
  Object.entries(CATEGORIES).forEach(([cat, criteria]) => {
    const scores = criteria.map((c) => rating[c.key] || 0).filter((v) => v > 0);
    result[cat] = scores.length > 0 ? Math.ceil(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });
  return result;
}