import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/admin";
import {
  adminApi,
  type AdminOrderDetail,
  type AdminOrderItem,
  type AdminRow,
  type AdminSnapshot,
} from "../../lib/admin-api";
import { entityMeta, tabs, type TabId } from "./admin-config";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - อาตี๋น้อย Delivery" },
    { name: "description", content: "ระบบจัดการร้านอาหารและออเดอร์" },
  ];
}

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

const riderStatusMeta: Record<string, { label: string; className: string }> = {
  assigned: { label: "ได้รับ Order แล้ว", className: "bg-blue-50 text-blue-700" },
  available: { label: "ยังไม่ได้รับ Order", className: "bg-emerald-50 text-emerald-700" },
  offline: { label: "ออฟไลน์", className: "bg-slate-100 text-slate-500" },
};

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ entity: keyof typeof entityMeta; row?: AdminRow } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = location.pathname.split("/")[2] || "";
  const activeTab: TabId = tabs.some((tab) => tab.id === section)
    ? (section as TabId)
    : "dashboard";

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    const token = sessionStorage.getItem("adminAccessToken");
    if (saved && token) {
      setAdminKey(saved);
      if (location.pathname === "/admin" || location.pathname === "/admin/") {
        navigate("/admin/dashboard", { replace: true });
      }
    } else if (location.pathname !== "/admin" && location.pathname !== "/admin/") {
      navigate("/admin", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (
      adminKey &&
      section &&
      !tabs.some((tab) => tab.id === section)
    ) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminKey, navigate, section]);

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
      navigate("/admin/dashboard", { replace: true });
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
    navigate("/admin", { replace: true });
  };

  if (!adminKey) {
    return (
      <AdminLoginPage
        keyInput={keyInput}
        loading={loading}
        error={error}
        onKeyChange={setKeyInput}
        onSubmit={login}
      />
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
                navigate(`/admin/${tab.id}`);
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
              <p className="text-xs text-slate-400">จัดการข้อมูลจาก Food API แบบเรียลไทม์</p>
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
  if (activeTab === "dashboard") return <DashboardPage snapshot={snapshot} />;
  if (activeTab === "orders")
    return <OrdersTable rows={snapshot.recent_orders} details={snapshot.order_details} riders={snapshot.riders} adminKey={adminKey} reload={reload} setError={setError} />;
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
                    {config.entity === "riders" && column === "status" ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riderStatusMeta[String(row[column])]?.className || "bg-slate-100 text-slate-500"}`}>
                        {riderStatusMeta[String(row[column])]?.label || String(row[column] ?? "-")}
                      </span>
                    ) : typeof row[column] === "boolean" ? (
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

function OrdersTable({ rows, details, riders, adminKey, reload, setError }: { rows: AdminRow[]; details: Record<string, AdminOrderDetail>; riders: AdminRow[]; adminKey: string; reload: () => Promise<void>; setError: (value: string) => void }) {
  const [selectedOrder, setSelectedOrder] = useState<AdminRow | null>(null);
  const update = async (order: AdminRow, field: "order_status" | "payment_status" | "rider_id", value: string) => {
    try {
      await adminApi.updateOrder(adminKey, String(order.order_id), { [field]: value });
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "อัปเดตไม่สำเร็จ");
    }
  };
  const remove = async (order: AdminRow) => {
    const orderNumber = String(order.order_number || order.order_id);
    if (!window.confirm(`ยืนยันลบออเดอร์ #${orderNumber} ถาวร? ข้อมูลที่เกี่ยวข้องจะถูกลบทั้งหมดและไม่สามารถกู้คืนได้`)) return;
    try {
      await adminApi.remove(adminKey, "orders", String(order.order_id));
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ลบออเดอร์ไม่สำเร็จ");
    }
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-black">จัดการออเดอร์</h2><p className="text-xs text-slate-400">อัปเดตสถานะ การชำระเงิน และมอบหมายไรเดอร์</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-4">ออเดอร์</th><th className="px-5 py-4">ร้าน</th><th className="px-5 py-4">ยอดรวม</th><th className="px-5 py-4">สถานะออเดอร์</th><th className="px-5 py-4">การชำระเงิน</th><th className="px-5 py-4">ไรเดอร์</th><th className="px-5 py-4">เวลา</th><th className="px-5 py-4 text-right">จัดการ</th></tr></thead>
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
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setSelectedOrder(order)} className="whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 font-bold text-blue-700 hover:bg-blue-100" title="ตรวจสอบรายการอาหาร"><i className="fas fa-list-check mr-2" />ตรวจสอบเมนู</button>
                    <button type="button" onClick={() => void remove(order)} className="rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100" title="ลบออเดอร์ถาวร"><i className="fas fa-trash mr-2" />ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <OrderMenuModal
          order={selectedOrder}
          detail={details[String(selectedOrder.order_id)]}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function OrderMenuModal({ order, detail, onClose }: { order: AdminRow; detail?: AdminOrderDetail; onClose: () => void }) {
  const items = detail?.items || [];
  const itemTotal = (item: AdminOrderItem) =>
    Number(item.line_total ?? Number(item.unit_price || 0) * Number(item.quantity || 0));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="order-menu-title" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">รายละเอียดออเดอร์</p>
            <h2 id="order-menu-title" className="mt-1 text-xl font-black">ตรวจสอบเมนู #{String(order.order_number || order.order_id)}</h2>
            <p className="mt-1 text-sm text-slate-400">ตรวจสอบรายการและตัวเลือกก่อนเริ่มจัดเตรียมอาหาร</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="ปิด"><i className="fas fa-xmark text-xl" /></button>
        </header>

        <div className="max-h-[calc(90vh-165px)] overflow-y-auto p-6">
          {items.length ? (
            <div className="space-y-3">
              {items.map((item, index) => {
                const options = item.options || [];
                return (
                  <article key={String(item.order_item_id || index)} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">{Number(item.quantity || 0)}x</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div><h3 className="font-black text-slate-800">{String(item.item_name_snapshot || item.name || item.menu_item_id || "ไม่ระบุชื่อเมนู")}</h3><p className="mt-1 text-xs text-slate-400">ราคาต่อชิ้น {money(item.unit_price)}</p></div>
                          <strong className="whitespace-nowrap text-primary">{money(itemTotal(item))}</strong>
                        </div>
                        {options.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{options.map((option, optionIndex) => <span key={String(option.order_item_option_id || optionIndex)} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">+ {String(option.option_name_snapshot || option.name || "ตัวเลือก")} {Number(option.extra_price || 0) > 0 ? `(${money(option.extra_price)})` : ""}</span>)}</div>}
                        {Boolean(item.note) && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"><i className="fas fa-note-sticky mr-2" />{String(item.note)}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 py-12 text-center text-slate-400"><i className="fas fa-bowl-food text-3xl" /><p className="mt-3 text-sm">ไม่พบรายละเอียดเมนูในออเดอร์นี้</p></div>
          )}

          <div className="mt-6 ml-auto max-w-sm space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <PriceLine label="ค่าอาหาร" value={order.subtotal} />
            <PriceLine label="ค่าจัดส่ง" value={order.delivery_fee} />
            {Number(order.discount || 0) > 0 && <PriceLine label="ส่วนลด" value={-Number(order.discount)} />}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base"><span className="font-bold">ยอดรวม</span><strong className="text-xl text-primary">{money(order.total)}</strong></div>
          </div>
        </div>
        <footer className="border-t border-slate-100 px-6 py-4 text-right"><button type="button" onClick={onClose} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800">ตรวจสอบเรียบร้อย</button></footer>
      </section>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: unknown }) {
  return <div className="flex justify-between text-slate-500"><span>{label}</span><span className="font-semibold text-slate-700">{money(value)}</span></div>;
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
    const payload: AdminRow = {};
    config.fields.forEach((field) => {
      const value = values[field.key];
      if (value === null || value === "") return;
      payload[field.key] = field.type === "number" ? Number(value) : value;
    });
    try { await onSave(payload); } catch (caught) { setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ"); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5"><div><h2 className="text-xl font-black">{row ? "แก้ไข" : "เพิ่ม"}{config.title}</h2><p className="text-xs text-slate-400">{row ? String(row[config.id]) : "สร้างรายการใหม่"}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><i className="fas fa-xmark text-xl" /></button></div>
        <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2">
          {config.fields.map((field) => (
            <label key={field.key} className={field.key.includes("url") ? "sm:col-span-2" : ""}><span className="mb-2 block text-sm font-bold text-slate-700">{field.label}{field.required && <span className="text-primary"> *</span>}</span>
              {field.type === "boolean" ? <input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => setValues({ ...values, [field.key]: event.target.checked })} className="h-5 w-5 accent-red-600" /> : field.type === "select" ? <select value={String(values[field.key] ?? "")} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-primary">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} min={field.min} max={field.max} value={String(values[field.key] ?? "")} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary" />}
            </label>
          ))}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500">ยกเลิก</button><button disabled={saving} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button></div>
        </form>
      </div>
    </div>
  );
}
