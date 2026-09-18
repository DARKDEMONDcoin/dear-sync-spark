/**
 * حدود الاختصاص بين الموظفين.
 * كل خدمة يملكها موظف واحد فقط: النشر على السوشيال لسِراج وحده، والسيو لنور،
 * والبريد والمواعيد لإيفا… إلخ. إن جاء الطلب لغير صاحبه يوجّه الموظف المستخدم فوراً.
 */
import { detectHandoff } from "./handoff";
import { employeeDirectory, type EmployeeId } from "./team-knowledge";

const OWNERSHIP: Record<string, string> = {
  sonny: "صناعة محتوى السوشيال والنشر والجدولة على إنستجرام وفيسبوك وتيك توك ولينكدإن وإكس ويوتيوب وبنترست",
  nour: "السيو والمقالات وصفحات الموقع والنشر على المدونة (ووردبريس/Shopify/Webflow/Ghost)",
  eva: "البريد والمواعيد والتقويم والتنظيم اليومي",
  sam: "المبيعات والعملاء المحتملين وعروض الأسعار والـ CRM",
  dana: "التصميم والهوية البصرية والعروض التقديمية",
  adam: "الأرقام والتقارير وأداء الحملات والميزانيات",
};

/** كتلة تعليمات تمنع الموظف من أداء عمل زميله وتجعله يحوّل الطلب فوراً. */
export function scopeBoundaryBlock(employeeId: string, message?: string): string {
  const me = employeeDirectory[employeeId as EmployeeId];
  if (!me) return "";

  const others = Object.entries(OWNERSHIP)
    .filter(([id]) => id !== employeeId)
    .map(([id, what]) => `- ${employeeDirectory[id as EmployeeId]?.name ?? id}: ${what}`)
    .join("\n");

  const lines = [
    "## حدود اختصاصك (إلزامي)",
    `اختصاصك أنت: ${OWNERSHIP[employeeId] ?? me.role}.`,
    "توزيع بقية الخدمات على زملائك:",
    others,
    "قاعدة صارمة: لا تنفّذ خدمة يملكها زميل. النشر والجدولة على منصات التواصل من اختصاص سِراج وحده، ولا يقدّمها أي موظف آخر ولا يَعِد بها.",
    "إن كان الطلب من اختصاص زميل: اعتذر بجملة واحدة ودودة، اذكر اسم الزميل وسبب أنه الأنسب، أخبر المستخدم أن زر «التوجّه إلى …» تحت ردك ينقل طلبه كما هو، ثم توقف. لا تكتب المخرج نيابةً عنه ولا خطة تنفيذ مفصّلة.",
    "إن كان في الطلب جزء يخصك فعلاً: نفّذ جزءك أنت فقط، وحوّل الباقي للزميل بنفس الطريقة.",
  ];

  const handoff = message ? detectHandoff(message, employeeId) : null;
  if (handoff) {
    lines.push(
      `تنبيه لهذه الرسالة تحديداً: طلب المستخدم (${handoff.topic}) من اختصاص ${handoff.name} — ${handoff.role}. وجّهه إليه الآن ولا تنفّذ الطلب.`,
    );
  }

  return lines.join("\n");
}
