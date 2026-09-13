import {
  formatPrice,
  getFactor,
  selectExplanationPoints,
  type Category,
  type Explanation,
  type FactorKey,
  type FactorScore,
  type GapExplanation,
  type ScoredDevice,
  type UseCase,
  type UseCaseProfile,
} from "@/lib/engine";
import type { Lang } from "./config";

/*
 * Hindi wording for everything the scoring engine says. The engine stays English;
 * these read the same numbers and the same selected points, so a Hindi explanation
 * never disagrees with the English one. Adjectives are the invariant kind
 * (बेहतरीन, दमदार, कमज़ोर) so they agree with any noun.
 */

interface FactorWords {
  label: string;
  noun: string;
  weakPhrase: string;
}

const shared: Partial<Record<FactorKey, FactorWords>> = {
  display: { label: "डिस्प्ले", noun: "डिस्प्ले क्वालिटी", weakPhrase: "साधारण डिस्प्ले" },
  ram: { label: "मेमोरी (RAM)", noun: "मेमोरी", weakPhrase: "कम RAM" },
  storage: { label: "स्टोरेज", noun: "स्टोरेज", weakPhrase: "कम स्टोरेज" },
  battery: { label: "बैटरी", noun: "बैटरी क्षमता", weakPhrase: "छोटी बैटरी" },
  price: { label: "कीमत", noun: "आपके बजट के हिसाब से कीमत", weakPhrase: "बजट की ऊपरी सीमा के पास कीमत" },
};

const FACTOR_HI: Record<Category, Partial<Record<FactorKey, FactorWords>>> = {
  laptop: {
    ...shared,
    cpu: { label: "प्रोसेसर", noun: "प्रोसेसर परफ़ॉर्मेंस", weakPhrase: "धीमा प्रोसेसर" },
    gpu: { label: "ग्राफ़िक्स", noun: "ग्राफ़िक्स परफ़ॉर्मेंस", weakPhrase: "कमज़ोर ग्राफ़िक्स" },
    portability: { label: "पोर्टेबिलिटी", noun: "पोर्टेबिलिटी", weakPhrase: "भारी बनावट" },
  },
  phone: {
    ...shared,
    cpu: { label: "परफ़ॉर्मेंस", noun: "चिपसेट परफ़ॉर्मेंस", weakPhrase: "धीमा चिपसेट" },
    camera: { label: "कैमरा", noun: "कैमरा क्वालिटी", weakPhrase: "औसत कैमरा" },
    charging: { label: "चार्जिंग", noun: "चार्जिंग स्पीड", weakPhrase: "धीमी चार्जिंग" },
    portability: { label: "हल्कापन", noun: "हाथ में आराम", weakPhrase: "भारी बॉडी" },
  },
};

const USE_CASE_HI: Record<Category, Partial<Record<UseCase, { label: string; description: string }>>> = {
  laptop: {
    gaming: { label: "गेमिंग", description: "नए गेम्स में हाई फ़्रेम रेट। पहले ग्राफ़िक्स, फिर प्रोसेसर और तेज़ स्क्रीन।" },
    coding: { label: "कोडिंग", description: "कंपाइल, कंटेनर और ढेर सारे टैब। प्रोसेसर और मेमोरी सबसे ज़रूरी।" },
    "video-editing": {
      label: "वीडियो एडिटिंग",
      description: "टाइमलाइन और एक्सपोर्ट। CPU और GPU दोनों में दम, भरपूर RAM और सटीक स्क्रीन।",
    },
    student: {
      label: "पढ़ाई और रोज़ का काम",
      description: "दिन भर चलने वाली बैटरी और बैग में आसानी से जाने वाला वज़न, बेवजह ज़्यादा खर्च के बिना।",
    },
    "all-rounder": { label: "ऑल-राउंडर", description: "थोड़ा-थोड़ा सब कुछ। कोई एक स्पेक हावी नहीं।" },
  },
  phone: {
    photography: { label: "फ़ोटोग्राफ़ी", description: "सबसे अच्छा कैमरा सिस्टम, और खींची तस्वीरें रखने की जगह।" },
    gaming: { label: "गेमिंग", description: "फ़्लैगशिप जैसा चिपसेट, स्मूद डिस्प्ले और लंबे सेशन झेलने वाली बैटरी।" },
    battery: { label: "बैटरी लाइफ़", description: "एक चार्ज में सबसे ज़्यादा चले, और जल्दी फिर से चार्ज हो।" },
    budget: { label: "बजट में", description: "ज़रूरी चीज़ें अच्छी तरह, और पैसे बचाना भी एक फ़ीचर।" },
    "all-rounder": { label: "ऑल-राउंडर", description: "अच्छा कैमरा, अच्छी स्पीड, अच्छी बैटरी। कोई एक स्पेक हावी नहीं।" },
  },
};

const MUST_HAVE_HI: Record<string, string> = {
  oled: "OLED स्क्रीन",
  hz120: "120Hz या ज़्यादा",
  telephoto: "ज़ूम (टेलीफ़ोटो) कैमरा",
  battery6000: "6,000 mAh+ बैटरी",
  charge65: "65W+ चार्जिंग",
  ram12: "12GB+ RAM",
  storage256: "256GB+ स्टोरेज",
  compact: "कॉम्पैक्ट (6.4\" या छोटा)",
  rtx: "NVIDIA RTX ग्राफ़िक्स",
  ram16: "16GB+ RAM",
  ram32: "32GB+ RAM",
  storage1tb: "1TB+ स्टोरेज",
  light: "1.5 kg से कम",
  battery60: "60Wh+ बैटरी",
};

export function factorLabel(lang: Lang, category: Category, key: FactorKey): string {
  if (lang === "hi") return FACTOR_HI[category][key]?.label ?? getFactor(category, key).label;
  return getFactor(category, key).label;
}

export function profileText(lang: Lang, profile: Pick<UseCaseProfile, "category" | "id" | "label" | "description">) {
  const hi = lang === "hi" ? USE_CASE_HI[profile.category][profile.id] : undefined;
  return { label: hi?.label ?? profile.label, description: hi?.description ?? profile.description };
}

export function mustHaveLabel(lang: Lang, id: string, fallback: string): string {
  return lang === "hi" ? (MUST_HAVE_HI[id] ?? fallback) : fallback;
}

/** "86/100 tier" reads as "86/100 स्तर"; units like GB and mAh stay as they are. */
export function localizeValue(lang: Lang, value: string): string {
  return lang === "hi" ? value.replace("/100 tier", "/100 स्तर") : value;
}

export function levelHi(score: number): string {
  if (score >= 85) return "बेहतरीन";
  if (score >= 70) return "दमदार";
  if (score >= 55) return "बढ़िया";
  if (score >= 40) return "ठीक-ठाक";
  return "कमज़ोर";
}

function joinHi(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} और ${items.at(-1)}`;
}

function words(category: Category, key: FactorKey): FactorWords {
  const english = getFactor(category, key);
  return FACTOR_HI[category][key] ?? { label: english.label, noun: english.noun, weakPhrase: english.weakPhrase };
}

export function explainHi(
  breakdown: FactorScore[],
  penalties: ScoredDevice["penalties"],
  profile: UseCaseProfile,
  matchRank: number,
  poolSize: number,
): Explanation {
  const { strengths, tradeoffs, penalized, unlisted } = selectExplanationPoints(breakdown, penalties);
  const w = (f: FactorScore) => words(profile.category, f.key);
  const label = profileText("hi", profile).label;
  const value = (f: FactorScore) => localizeValue("hi", f.displayValue);

  const standing =
    matchRank === 1 && poolSize > 1
      ? `आपके बजट में ${label} के लिए सबसे अच्छा मैच`
      : `${label} के लिए ${poolSize} में से #${matchRank}`;

  let body: string;
  if (strengths.length && tradeoffs.length) {
    body = `${joinHi(strengths.map((f) => w(f).noun))} में दमदार, लेकिन ${joinHi(tradeoffs.map((f) => w(f).weakPhrase))} इसे पीछे करते हैं।`;
  } else if (strengths.length) {
    body = `${joinHi(strengths.map((f) => w(f).noun))} में दमदार, और इस काम के लिए कोई बड़ी कमी नहीं।`;
  } else if (tradeoffs.length) {
    body = `इस काम के लिए कोई ख़ास खूबी नहीं, और ${joinHi(tradeoffs.map((f) => w(f).weakPhrase))} इसे पीछे करते हैं।`;
  } else {
    body = "बिना किसी ख़ास खूबी या कमी वाला संतुलित विकल्प।";
  }

  const caveat = unlisted.length
    ? ` ${joinHi(unlisted.map((f) => w(f).label))} की जानकारी अभी उपलब्ध नहीं है, इसलिए इसे औसत मानकर स्कोर किया गया है।`
    : "";

  return {
    summary: `${standing}: ${body}${caveat}`,
    strengths: strengths.map((f) => `${levelHi(f.score)} ${w(f).noun} (${value(f)})`),
    tradeoffs: tradeoffs.map((f) =>
      penalized.has(f.key)
        ? `${w(f).noun} ${label} की न्यूनतम ज़रूरत से कम (${value(f)})`
        : `${w(f).weakPhrase} (${value(f)})`,
    ),
  };
}

/** The same scored device with Hindi labels and explanation. Numbers are untouched. */
export function localizeScored(lang: Lang, scored: ScoredDevice, profile: UseCaseProfile, poolSize: number): ScoredDevice {
  if (lang !== "hi") return scored;
  const category = profile.category;
  return {
    ...scored,
    breakdown: scored.breakdown.map((f) => ({
      ...f,
      label: factorLabel("hi", category, f.key),
      displayValue: localizeValue("hi", f.displayValue),
    })),
    penalties: scored.penalties.map((p) => ({ ...p, label: factorLabel("hi", category, p.key) })),
    explanation: explainHi(scored.breakdown, scored.penalties, profile, scored.matchRank, poolSize),
  };
}

export function localizeGap(lang: Lang, gap: GapExplanation, category: Category): GapExplanation {
  if (lang !== "hi") return gap;
  const label = (key: FactorKey) => factorLabel("hi", category, key);
  const parts: string[] = [];
  if (gap.losses.length) {
    const trails = gap.losses
      .slice(0, 2)
      .map((g) => `${label(g.key)} (${localizeValue("hi", g.deviceValue)} बनाम ${localizeValue("hi", g.leaderValue)})`);
    parts.push(`यह ${joinHi(trails)} में पीछे है`);
  }
  if (gap.penaltyPoints >= 0.5) parts.push("इस काम की एक न्यूनतम ज़रूरत पूरी नहीं करता");
  let summary =
    parts.length > 0
      ? `${parts.join(", और ")}, जिससे इसके ${gap.pointsBehind} पॉइंट कटते हैं।`
      : `यह #1 से सिर्फ़ ${Math.max(0, gap.pointsBehind)} पॉइंट पीछे है।`;
  if (gap.gains.length) summary += ` ${label(gap.gains[0].key)} में यह #1 से आगे है।`;
  if (gap.priceDifference < 0) summary += ` साथ ही यह ${formatPrice(-gap.priceDifference)} सस्ता है।`;

  const loc = (g: GapExplanation["losses"][number]) => ({
    ...g,
    label: label(g.key),
    deviceValue: localizeValue("hi", g.deviceValue),
    leaderValue: localizeValue("hi", g.leaderValue),
  });
  return { ...gap, losses: gap.losses.map(loc), gains: gap.gains.map(loc), summary };
}
