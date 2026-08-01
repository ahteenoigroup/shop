import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin";
import {
  adminApi,
  type AdminEntity,
  type AdminRow,
  type AdminSnapshot,
} from "../lib/admin-api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - อาตี๋น้อย Delivery" },
    { name: "description", content: "ระบบจัดการร้านอาหารและออเดอร์" },
  ];
}

type TabId =
  | "dashboard"
  | "orders"
  | "restaurants"
  | "menu_items"
  | "customers"
  | "riders"
  | "payments";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "ภาพรวม", icon: "fa-chart-pie" },
  { id: "orders", label: "ออเดอร์", icon: "fa-receipt" },
  { id: "restaurants", label: "ร้านอาหาร", icon: "fa-store" },
  { id: "menu_items", label: "เมนูอาหาร", icon: "fa-bowl-food" },
  { id: "customers", label: "ลูกค้า", icon: "fa-users" },
  { id: "riders", label: "ไรเดอร์", icon: "fa-motorcycle" },
  { id: "payments", label: "การชำระเงิน", icon: "fa-credit-card" },
];

const entityMeta: Record<
  Exclude<TabId, "dashboard" | "orders" | "payments">,
  { entity: AdminEntity; id: string; title: string; fields: FieldConfig[] }
> = {
  restaurants: {
    entity: "restaurants",
    id: "restaurant_id",
    title: "ร้านอาหาร",
    fields: [
      { key: "category_id", label: "รหัสหมวดหมู่", required: true },
      { key: "name", label: "ชื่อร้าน", required: true },
      { key: "rating", label: "คะแนน", type: "number" },
      { key: "image_url", label: "URL รูปภาพ" },
      { key: "delivery_min_minutes", label: "เวลาส่งต่ำสุด", type: "number" },
      { key: "delivery_max_minutes", label: "เวลาส่งสูงสุด", type: "number" },
      { key: "distance_km", label: "ระยะทาง (กม.)", type: "number" },
      { key: "is_popular", label: "ร้านยอดนิยม", type: "boolean" },
      { key: "is_active", label: "เปิดให้บริการ", type: "boolean" },
    ],
  },
  menu_items: {
    entity: "menu_items",
    id: "menu_item_id",
    title: "เมนูอาหาร",
    fields: [
      { key: "restaurant_id", label: "รหัสร้าน", required: true },
      { key: "name", label: "ชื่อเมนู", required: true },
      { key: "category", label: "ประเภทเมนู", required: true },
      { key: "base_price", label: "ราคา", type: "number", required: true },
      { key: "rating", label: "คะแนน", type: "number" },
      { key: "image_url", label: "URL รูปภาพ" },
      { key: "is_popular", label: "เมนูยอดนิยม", type: "boolean" },
      { key: "is_available", label: "พร้อมขาย", type: "boolean" },
    ],
  },
  customers: {
    entity: "customers",
    id: "customer_id",
    title: "ลูกค้า",
    fields: [
      { key: "full_name", label: "ชื่อลูกค้า", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", required: true },
      { key: "email", label: "อีเมล" },
      { key: "is_active", label: "เปิดใช้งาน", type: "boolean" },
    ],
  },
  riders: {
    entity: "riders",
    id: "rider_id",
    title: "ไรเดอร์",
    fields: [
      { key: "full_name", label: "ชื่อไรเดอร์", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", required: true },
      { key: "vehicle_type", label: "ประเภทรถ" },
      { key: "license_plate", label: "ทะเบียนรถ" },
      {
        key: "status",
        label: "สถานะ",
        type: "select",
        options: [
          { value: "available", label: "พร้อมรับงาน" },
          { value: "assigned", label: "กำลังส่ง" },
          { value: "offline", label: "ออฟไลน์" },
        ],
      },
    ],
  },
};

const orderStatusLabels: Record<string, string> = {
  received: "รับออเดอร์แล้ว",
  preparing: "กำลังปรุง",
  delivering: "กำลังจัดส่ง",
  delivered: "ส่งสำเร็จ",
  cancelled: "ยกเลิก",
};

const statusClass = (status: string) => {
  if (["paid", "delivered", "available"].includes(status))
    return "bg-emerald-50 text-emerald-700";
  if (["preparing", "assigned", "pending"].includes(status))
    return "bg-amber-50 text-amber-700";
  if (["cancelled", "failed", "offline"].includes(status))
    return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
};

const money = (value: unknown) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ entity: keyof typeof entityMeta; row?: AdminRow } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    const token = sessionStorage.getItem("adminAccessToken");
    if (saved && token) setAdminKey(saved);
  }, []);

  const loadSnapshot = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.snapshot(key);
      setSnapshot(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดข้อมูลไม่สำเร็จ");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) void loadSnapshot(adminKey);
  }, [adminKey, loadSnapshot]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.authenticate(keyInput.trim());
      sessionStorage.setItem("adminKey", keyInput.trim());
      sessionStorage.setItem("adminAccessToken", result.access_token);
      setAdminKey(keyInput.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("adminKey");
    sessionStorage.removeItem("adminAccessToken");
    setAdminKey("");
    setKeyInput("");
    setSnapshot(null);
  };

  if (!adminKey || (!snapshot && !loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-red-200">
            <i className="fas fa-shield-halved text-xl" />
          </div>
          <p className="text-sm font-bold text-primary">อาตี๋น้อย Delivery</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Admin Login</h1>
          <p className="mt-3 text-sm text-slate-500">
            กรอก Admin key สำหรับเข้าสู่ระบบผู้ดูแล
          </p>
          <form onSubmit={login} className="mt-8">
            <label htmlFor="admin-key" className="mb-2 block text-sm font-bold text-slate-700">
              Admin key
            </label>
            <input
              id="admin-key"
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-red-100"
              autoFocus
            />
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบจัดการ"}
            </button>
          </form>
          <Link to="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-primary">
            <i className="fas fa-arrow-left mr-2" /> กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 px-4 py-6 text-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
            <i className="fas fa-utensils" />
          </span>
          <div>
            <p className="font-black">อาตี๋น้อย</p>
            <p className="text-xs text-slate-400">Admin Console</p>
          </div>
        </div>
        <nav className="mt-10 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
                setSearch("");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <i className={`fas ${tab.icon} w-5 text-center`} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4">
          <Link to="/shop" className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            <i className="fas fa-arrow-up-right-from-square w-5 text-center" />
            ดูหน้าเว็บไซต์
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400">
            <i className="fas fa-right-from-bracket w-5 text-center" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-slate-500 lg:hidden">
              <i className="fas fa-bars" />
            </button>
            <div>
              <h1 className="text-xl font-black">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
              <p className="text-xs text-slate-400">จัดการข้อมูลจาก Google Sheets แบบเรียลไทม์</p>
            </div>
          </div>
          <button
            onClick={() => void loadSnapshot(adminKey)}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <i className={`fas fa-rotate mr-2 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </header>

        <main className="p-5 lg:p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <i className="fas fa-circle-exclamation mr-2" /> {error}
            </div>
          )}
          {loading && !snapshot ? (
            <div className="py-32 text-center text-slate-400">
              <i className="fas fa-spinner animate-spin text-3xl" />
              <p className="mt-3">กำลังโหลดข้อมูล...</p>
            </div>
          ) : snapshot ? (
            <AdminContent
              activeTab={activeTab}
              snapshot={snapshot}
              search={search}
              setSearch={setSearch}
              setModal={setModal}
              adminKey={adminKey}
              reload={() => loadSnapshot(adminKey)}
              setError={setError}
            />
          ) : null}
        </main>
      </div>

      {modal && (
        <EntityModal
          config={entityMeta[modal.entity]}
          row={modal.row}
          onClose={() => setModal(null)}
          onSave={async (values) => {
            const config = entityMeta[modal.entity];
            await adminApi.upsert(
              adminKey,
              config.entity,
              values,
              modal.row ? String(modal.row[config.id]) : undefined,
            );
            setModal(null);
            await loadSnapshot(adminKey);
          }}
        />
      )}
    </div>
  );
}

function AdminContent({
  activeTab,
  snapshot,
  search,
  setSearch,
  setModal,
  adminKey,
  reload,
  setError,
}: {
  activeTab: TabId;
  snapshot: AdminSnapshot;
  search: string;
  setSearch: (value: string) => void;
  setModal: (value: { entity: keyof typeof entityMeta; row?: AdminRow } | null) => void;
  adminKey: string;
  reload: () => Promise<void>;
  setError: (value: string) => void;
}) {
  if (activeTab === "dashboard") return <Dashboard snapshot={snapshot} />;
  if (activeTab === "orders")
    return <OrdersTable rows={snapshot.recent_orders} riders={snapshot.riders} adminKey={adminKey} reload={reload} setError={setError} />;
  if (activeTab === "payments")
    return <SimpleTable title="รายการชำระเงิน" rows={snapshot.payments} columns={["payment_id", "order_id", "method", "amount", "status", "paid_at"]} search={search} setSearch={setSearch} />;

  const config = entityMeta[activeTab];
  const rows = snapshot[activeTab] as AdminRow[];
  return (
    <EntityTable
      config={config}
      rows={rows}
      search={search}
      setSearch={setSearch}
      onAdd={() => setModal({ entity: activeTab })}
      onEdit={(row) => setModal({ entity: activeTab, row })}
      onDelete={async (row) => {
        if (!window.confirm(`ยืนยันปิดใช้งาน ${String(row[config.id])}?`)) return;
        try {
          await adminApi.remove(adminKey, config.entity, String(row[config.id]));
          await reload();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "ดำเนินการไม่สำเร็จ");
        }
      }}
    />
  );
}

function Dashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const cards = [
    { label: "ยอดขายวันนี้", value: money(snapshot.stats.today_revenue), icon: "fa-coins", color: "bg-emerald-500" },
    { label: "ออเดอร์วันนี้", value: snapshot.stats.today_orders, icon: "fa-receipt", color: "bg-blue-500" },
    { label: "ออเดอร์กำลังดำเนินการ", value: snapshot.stats.active_orders, icon: "fa-clock", color: "bg-amber-500" },
    { label: "ลูกค้าทั้งหมด", value: snapshot.stats.customers, icon: "fa-users", color: "bg-violet-500" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${card.color}`}>
              <i className={`fas ${card.icon}`} />
            </div>
            <p className="mt-5 text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-black">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-black">ออเดอร์ล่าสุด</h2>
            <span className="text-xs text-slate-400">{snapshot.stats.orders} ออเดอร์ทั้งหมด</span>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.recent_orders.slice(0, 6).map((order) => (
              <div key={String(order.order_id)} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">#{String(order.order_number)}</p>
                  <p className="text-xs text-slate-400">{String(order.ordered_at || "")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{money(order.total)}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(String(order.order_status))}`}>
                    {orderStatusLabels[String(order.order_status)] || String(order.order_status)}
                  </span>
                </div>
              </div>
            ))}
            {!snapshot.recent_orders.length && <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีออเดอร์</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm text-slate-400">รายได้สะสม</p>
          <p className="mt-2 text-3xl font-black">{money(snapshot.stats.total_revenue)}</p>
          <div className="mt-8 space-y-4">
            <StatLine label="ร้านที่เปิด" value={`${snapshot.stats.active_restaurants}/${snapshot.stats.restaurants}`} />
            <StatLine label="เมนูที่พร้อมขาย" value={`${snapshot.stats.available_menu_items}/${snapshot.stats.menu_items}`} />
            <StatLine label="ไรเดอร์" value={`${snapshot.stats.riders} คน`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-white/10 pb-3 text-sm"><span className="text-slate-400">{label}</span><strong>{value}</strong></div>;
}

function EntityTable({
  config,
  rows,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  config: (typeof entityMeta)[keyof typeof entityMeta];
  rows: AdminRow[];
  search: string;
  setSearch: (value: string) => void;
  onAdd: () => void;
  onEdit: (row: AdminRow) => void;
  onDelete: (row: AdminRow) => void;
}) {
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [rows, search]);
  const columns = [config.id, ...config.fields.slice(0, 5).map((field) => field.key)];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <TableToolbar title={`${config.title}ทั้งหมด`} count={filtered.length} search={search} setSearch={setSearch} onAdd={onAdd} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>{columns.map((column) => <th key={column} className="px-5 py-4">{column}</th>)}<th className="px-5 py-4 text-right">จัดการ</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={String(row[config.id])} className="hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column} className="max-w-[260px] truncate px-5 py-4">
                    {typeof row[column] === "boolean" ? (
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${row[column] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row[column] ? "เปิด" : "ปิด"}</span>
                    ) : String(row[column] ?? "-")}
                  </td>
                ))}
                <td className="px-5 py-4 text-right">
                  <button onClick={() => onEdit(row)} className="mr-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100"><i className="fas fa-pen" /></button>
                  <button onClick={() => onDelete(row)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100"><i className="fas fa-power-off" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTable({ rows, riders, adminKey, reload, setError }: { rows: AdminRow[]; riders: AdminRow[]; adminKey: string; reload: () => Promise<void>; setError: (value: string) => void }) {
  const update = async (order: AdminRow, field: "order_status" | "payment_status" | "rider_id", value: string) => {
    try {
      await adminApi.updateOrder(adminKey, String(order.order_id), { [field]: value });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "อัปเดตไม่สำเร็จ");
    }
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-black">จัดการออเดอร์</h2><p className="text-xs text-slate-400">อัปเดตสถานะ การชำระเงิน และมอบหมายไรเดอร์</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-4">ออเดอร์</th><th className="px-5 py-4">ร้าน</th><th className="px-5 py-4">ยอดรวม</th><th className="px-5 py-4">สถานะออเดอร์</th><th className="px-5 py-4">การชำระเงิน</th><th className="px-5 py-4">ไรเดอร์</th><th className="px-5 py-4">เวลา</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((order) => (
              <tr key={String(order.order_id)}>
                <td className="px-5 py-4 font-bold">#{String(order.order_number)}</td>
                <td className="px-5 py-4">{String(order.restaurant_id)}</td>
                <td className="px-5 py-4 font-black">{money(order.total)}</td>
                <td className="px-5 py-4"><select value={String(order.order_status)} onChange={(event) => void update(order, "order_status", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="received">รับออเดอร์</option><option value="preparing">กำลังปรุง</option><option value="delivering">กำลังจัดส่ง</option><option value="delivered">ส่งสำเร็จ</option><option value="cancelled">ยกเลิก</option></select></td>
                <td className="px-5 py-4"><select value={String(order.payment_status)} onChange={(event) => void update(order, "payment_status", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="pending">รอชำระ</option><option value="paid">ชำระแล้ว</option><option value="failed">ล้มเหลว</option><option value="refunded">คืนเงิน</option></select></td>
                <td className="px-5 py-4"><select value={String(order.rider_id || "")} onChange={(event) => void update(order, "rider_id", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="">ยังไม่กำหนด</option>{riders.map((rider) => <option key={String(rider.rider_id)} value={String(rider.rider_id)}>{String(rider.full_name)}</option>)}</select></td>
                <td className="px-5 py-4 text-xs text-slate-400">{String(order.ordered_at || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimpleTable({ title, rows, columns, search, setSearch }: { title: string; rows: AdminRow[]; columns: string[]; search: string; setSearch: (value: string) => void }) {
  const filtered = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <TableToolbar title={title} count={filtered.length} search={search} setSearch={setSearch} />
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr>{columns.map((column) => <th key={column} className="px-5 py-4">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column} className="px-5 py-4">{column === "amount" ? money(row[column]) : column === "status" ? <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass(String(row[column]))}`}>{String(row[column])}</span> : String(row[column] ?? "-")}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}

function TableToolbar({ title, count, search, setSearch, onAdd }: { title: string; count: number; search: string; setSearch: (value: string) => void; onAdd?: () => void }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-black">{title}</h2><p className="text-xs text-slate-400">{count} รายการ</p></div>
      <div className="flex gap-2">
        <div className="relative"><i className="fas fa-search absolute left-3 top-3 text-xs text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา..." className="rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" /></div>
        {onAdd && <button onClick={onAdd} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"><i className="fas fa-plus mr-2" />เพิ่ม</button>}
      </div>
    </div>
  );
}

function EntityModal({ config, row, onClose, onSave }: { config: (typeof entityMeta)[keyof typeof entityMeta]; row?: AdminRow; onClose: () => void; onSave: (values: AdminRow) => Promise<void> }) {
  const [values, setValues] = useState<AdminRow>(() => {
    const initial: AdminRow = {};
    config.fields.forEach((field) => { initial[field.key] = row?.[field.key] ?? (field.type === "boolean" ? true : ""); });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try { await onSave(values); } catch (caught) { setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ"); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5"><div><h2 className="text-xl font-black">{row ? "แก้ไข" : "เพิ่ม"}{config.title}</h2><p className="text-xs text-slate-400">{row ? String(row[config.id]) : "สร้างรายการใหม่"}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><i className="fas fa-xmark text-xl" /></button></div>
        <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2">
          {config.fields.map((field) => (
            <label key={field.key} className={field.key.includes("url") ? "sm:col-span-2" : ""}><span className="mb-2 block text-sm font-bold text-slate-700">{field.label}{field.required && <span className="text-primary"> *</span>}</span>
              {field.type === "boolean" ? <input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => setValues({ ...values, [field.key]: event.target.checked })} className="h-5 w-5 accent-red-600" /> : field.type === "select" ? <select value={String(values[field.key] ?? "")} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-primary">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} value={String(values[field.key] ?? "")} onChange={(event) => setValues({ ...values, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary" />}
            </label>
          ))}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500">ยกเลิก</button><button disabled={saving} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button></div>
        </form>
      </div>
    </div>
  );
}
