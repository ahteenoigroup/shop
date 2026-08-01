import type { AdminSnapshot } from "../../../lib/admin-api";

const money = (value: unknown) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(value || 0));

const statusClass = (status: string) => {
  if (["paid", "delivered", "available"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["preparing", "assigned", "pending"].includes(status)) return "bg-amber-50 text-amber-700";
  if (["cancelled", "failed", "offline"].includes(status)) return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
};

const labels: Record<string, string> = {
  received: "รับออเดอร์แล้ว", preparing: "กำลังปรุง", delivering: "กำลังจัดส่ง",
  delivered: "ส่งสำเร็จ", cancelled: "ยกเลิก",
};

export function DashboardPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const cards = [
    { label: "ยอดขายวันนี้", value: money(snapshot.stats.today_revenue), icon: "fa-coins", color: "bg-emerald-500" },
    { label: "ออเดอร์วันนี้", value: snapshot.stats.today_orders, icon: "fa-receipt", color: "bg-blue-500" },
    { label: "ออเดอร์กำลังดำเนินการ", value: snapshot.stats.active_orders, icon: "fa-clock", color: "bg-amber-500" },
    { label: "ลูกค้าทั้งหมด", value: snapshot.stats.customers, icon: "fa-users", color: "bg-violet-500" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${card.color}`}><i className={`fas ${card.icon}`} /></div><p className="mt-5 text-sm text-slate-500">{card.label}</p><p className="mt-1 text-2xl font-black">{card.value}</p></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between"><h2 className="font-black">ออเดอร์ล่าสุด</h2><span className="text-xs text-slate-400">{snapshot.stats.orders} ออเดอร์ทั้งหมด</span></div>
          <div className="mt-5 space-y-3">
            {snapshot.recent_orders.slice(0, 6).map((order) => <div key={String(order.order_id)} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><div><p className="text-sm font-bold">#{String(order.order_number)}</p><p className="text-xs text-slate-400">{String(order.ordered_at || "")}</p></div><div className="text-right"><p className="text-sm font-black">{money(order.total)}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(String(order.order_status))}`}>{labels[String(order.order_status)] || String(order.order_status)}</span></div></div>)}
            {!snapshot.recent_orders.length && <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีออเดอร์</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm text-slate-400">รายได้สะสม</p><p className="mt-2 text-3xl font-black">{money(snapshot.stats.total_revenue)}</p>
          <div className="mt-8 space-y-4"><StatLine label="ร้านที่เปิด" value={`${snapshot.stats.active_restaurants}/${snapshot.stats.restaurants}`} /><StatLine label="เมนูที่พร้อมขาย" value={`${snapshot.stats.available_menu_items}/${snapshot.stats.menu_items}`} /><StatLine label="ไรเดอร์" value={`${snapshot.stats.riders} คน`} /></div>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-white/10 pb-3 text-sm"><span className="text-slate-400">{label}</span><strong>{value}</strong></div>;
}
