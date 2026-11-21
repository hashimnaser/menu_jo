import AdminGate from "./AdminGate";

export const metadata = { title: "لوحة الإدارة | MenU" };

const cards = [
  {
    href: "/admin/restaurants",
    number: "01",
    title: "إدارة المطاعم",
    description: "استعرض المطاعم الحالية، عدّل بياناتها أو احذف ما لم تعد بحاجة إليه.",
    action: "عرض المطاعم",
    accent: "from-cyan-400/20 to-blue-500/5",
    icon: "☷",
  },
  {
    href: "/admin/add-restaurant",
    number: "02",
    title: "إضافة مطعم",
    description: "أضف مطعماً جديداً، وأدخل تفاصيله ومنيوه وصوره خطوة بخطوة.",
    action: "ابدأ الإضافة",
    accent: "from-amber-400/20 to-orange-500/5",
    icon: "+",
  },
];

export default function AdminHomePage() {
  return (
    <AdminGate>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14" dir="rtl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-7 shadow-2xl shadow-black/20 sm:p-11">
          <span aria-hidden="true" className="absolute -left-14 -top-20 h-64 w-64 rounded-full border-[2rem] border-amber-300/[0.06]" />
          <span aria-hidden="true" className="absolute bottom-[-7rem] left-[38%] h-56 w-56 rounded-full bg-cyan-400/[0.06] blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-bold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              لوحة التحكم
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">أهلاً بك في إدارة MenU</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              كل أدوات إدارة المطاعم في مكان واحد. اختر من أين تحب أن تبدأ.
            </p>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <p className="text-sm font-bold text-amber-300">مساحة العمل</p>
            <h2 className="mt-1 text-xl font-bold">ماذا تريد أن تفعل؟</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl sm:p-8"
              >
                <span aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${card.accent}`} />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/40 text-2xl font-bold text-amber-200">
                    {card.icon}
                  </span>
                  <span className="text-xs font-bold tracking-widest text-slate-500">{card.number}</span>
                </div>
                <h3 className="relative mt-7 text-xl font-bold">{card.title}</h3>
                <p className="relative mt-2 min-h-14 text-sm leading-7 text-slate-300">{card.description}</p>
                <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-200">
                  {card.action}
                  <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">←</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
