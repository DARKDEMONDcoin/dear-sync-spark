/**
 * ترجيح الأدلة — الفرق بين «جمعنا روابط» و«قدّمنا بحثاً».
 *
 * جمع النتائج سهل؛ الصعب هو ألا نضع رأي مدوّنة تسويقية في مرتبة دراسة محكّمة،
 * وألا نكرر الرابط نفسه بصيغ مختلفة، وأن نميّز ما تطابقت عليه مصادر مستقلة
 * عمّا قاله مصدر واحد. ثلاث قواعد تحكم الترتيب:
 *
 * 1) سلطة المصدر : جهة رسمية أو دراسة محكّمة أعلى من مدوّنة أو منصة إعلانية.
 * 2) الحداثة     : كل سنة تباعد تخصم؛ والسنة الحالية لا تُخصم إطلاقاً.
 * 3) التطابق     : ما يظهر عند مصدرين مستقلّين يُرفع ويُعلَّم «مؤكَّد».
 */
import type { Finding } from "./open-data.server";

/** سلطة كل مصدر (0–10). الرقم قرار تحريري لا حسابي. */
const SOURCE_WEIGHT: Record<string, number> = {
  "البنك الدولي": 10,
  OpenAlex: 9,
  Crossref: 9,
  arXiv: 7,
  Wikidata: 7,
  "Exchange Rate API": 8,
  "Wayback Machine": 7,
  OpenStreetMap: 8,
  "Google Trends": 8,
  "Google News": 6,
  "Hacker News": 6,
  GitHub: 6,
  "Stack Exchange": 6,
  DuckDuckGo: 5,
  ويكيبيديا: 6,
  SearXNG: 5,
  "بحث ويب": 5,
};
const DEFAULT_WEIGHT = 4;

/** نطاقات معروفة برداءة الإشارة: محتوى مجمَّع أو منتديات سبام أو صفحات تجميع روابط. */
const LOW_SIGNAL = /(pinterest\.|quora\.com|slideshare|scribd|ezinearticles|blogspot\.|medium\.com\/@)/i;
/** نطاقات مؤسسية تستحق رفعاً: منظمات ودول وجامعات. */
const HIGH_SIGNAL = /\.(gov|gov\.[a-z]{2}|edu|int)(\/|$)|\.org\//i;

/** أدوات لغوية خفيفة: توحيد العربية ليُقارن «الإعلانات» بـ«اعلان». */
const AR_STOP = new Set([
  "في","من","على","عن","إلى","الى","مع","هذا","هذه","التي","الذي","كيف","ما","ماذا","هل",
  "أفضل","افضل","أهم","اهم","لكل","بين","كل","the","and","for","with","best","how","what",
]);

export const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const topicTokens = (topic: string): string[] =>
  [...new Set(normalizeText(topic).split(" "))].filter((w) => w.length > 2 && !AR_STOP.has(w));

/**
 * نسبة كلمات الموضوع الظاهرة في الدليل (0–1).
 * هذا هو الحارس الذي يمنع «ورقة فيزياء فلكية» أو «رحلة إلى زيورخ» من التسلل
 * إلى أدلة موضوع عن المطاعم لمجرد أن مصدرها قوي.
 */
export function relevanceOf(finding: Finding, tokens: string[]): number {
  if (!tokens.length) return 1;
  const hay = normalizeText(`${finding.title} ${finding.snippet} ${finding.url}`);
  const hit = tokens.filter((t) => hay.includes(t)).length;
  return hit / tokens.length;
}

export type RankedFinding = Finding & {
  score: number;
  /** ظهر المعنى نفسه في أكثر من مصدر مستقل. */
  corroborated: boolean;
};

const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return `${u.host.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

/** بصمة دلالية خشنة للعنوان: تكشف نفس الخبر بصياغتين. */
const fingerprint = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .sort()
    .join(" ");

/**
 * يرتّب الأدلة ويحذف المكرر ويعلّم المتطابق عليه.
 * لا يحذف مصدراً ضعيفاً بالكامل: يضعه في ذيل القائمة حيث يستحق.
 */
export function rankFindings(
  findings: Finding[],
  opts: { topic?: string; aux?: string; max?: number } = {},
): RankedFinding[] {
  const max = opts.max ?? 14;
  /** كلمات الموضوع نفسه: لا يُقبل دليل لا يلمس واحدة منها على الأقل. */
  const core = topicTokens(opts.topic ?? "");
  /** كلمات السياق (القطاع، المدينة): ترفع الترتيب ولا تكفي وحدها للقبول. */
  const aux = topicTokens(opts.aux ?? "").filter((t) => !core.includes(t));
  const year = new Date().getFullYear();
  const byUrl = new Map<string, RankedFinding>();
  const prints = new Map<string, Set<string>>();

  const hits = (f: Finding, list: string[]) => {
    const hay = normalizeText(`${f.title} ${f.snippet} ${f.url}`);
    return list.filter((t) => hay.includes(t)).length;
  };
  const titleHits = (f: Finding, list: string[]) => {
    const hay = normalizeText(f.title);
    return list.filter((t) => hay.includes(t)).length;
  };

  for (const f of findings) {
    if (!f.title || !f.url) continue;
    const weight = SOURCE_WEIGHT[f.source] ?? DEFAULT_WEIGHT;
    const coreHit = hits(f, core);

    // الخلفية العامة لا تخضع لفحص الصلة لأنها لا تُقدَّم كدليل على الموضوع.
    if (f.kind !== "context" && core.length) {
      // (1) لا بد من لمس كلمة من الموضوع نفسه — القطاع وحده لا يصنع صلة.
      if (coreHit < 1) continue;
      // (2) موضوع متعدد الكلمات يحتاج تقاطعين، وإلا فهي مصادفة لفظية.
      if (core.length >= 3 && coreHit + hits(f, aux) < 2) continue;
      // (3) المصادر متوسطة السلطة (مدونات، نتائج عامة) يجب أن يظهر الموضوع في عنوانها،
      //     وإلا فهي صفحة عن شيء آخر ورد فيه لفظنا عرَضاً.
      if (weight <= 5 && titleHits(f, [...core, ...aux]) < 1) continue;
    }
    const key = normalizeUrl(f.url);

    // السلطة لا تُمنح كاملة إلا لمن غطّى الموضوع: دراسة محكّمة تلامس ثلث الموضوع
    // لا تسبق صفحة تتناوله بالكامل. التغطية تضرب السلطة ولا تُجمع إليها فقط.
    const coverage = core.length ? coreHit / core.length : 1;
    let score = weight * (0.3 + 0.7 * coverage);
    score += coverage * 3;
    score += aux.length ? (hits(f, aux) / aux.length) * 1.5 : 0;
    score += titleHits(f, core) > 0 ? 1.5 : 0;
    if (f.year) score -= Math.min(4, Math.max(0, year - f.year) * 0.8);
    if (HIGH_SIGNAL.test(f.url)) score += 2;
    if (LOW_SIGNAL.test(f.url)) score -= 3;
    if (f.snippet.length > 60) score += 0.5;

    const print = fingerprint(f.title);
    if (print) {
      const seen = prints.get(print) ?? new Set<string>();
      seen.add(f.source);
      prints.set(print, seen);
    }

    const prior = byUrl.get(key);
    if (!prior || score > prior.score) {
      byUrl.set(key, { ...f, score, corroborated: false });
    }
  }

  const rows = [...byUrl.values()].map((r) => {
    const sources = prints.get(fingerprint(r.title));
    const corroborated = (sources?.size ?? 0) > 1;
    return { ...r, corroborated, score: corroborated ? r.score + 2.5 : r.score };
  });

  return rows.sort((a, b) => b.score - a.score).slice(0, max);
}

/** يعرض الأدلة المرتّبة بصيغة يقرأها النموذج ويستشهد بها بدقة. */
export function renderRanked(title: string, rows: RankedFinding[]): string {
  if (!rows.length) return "";
  const lines = rows.map((r) => {
    const tag = r.corroborated ? " ✅ مؤكَّد من مصدرين" : "";
    const yr = r.year ? ` (${r.year})` : "";
    return `- **${r.title}**${yr} — ${r.source}${tag}\n  ${r.snippet}\n  ${r.url}`;
  });
  return `### ${title}\n${lines.join("\n")}`;
}
