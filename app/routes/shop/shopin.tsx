import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ensureGuestCustomer, foodApi, type ApiMenuItem, type ApiOrder, type ApiRestaurant } from "../../lib/food-api";
import { authApi } from "../../lib/auth-api";

type CartItem = ApiMenuItem & { quantity: number; optionIds: string[]; unitPrice: number };

export default function ShopDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
  const [menu, setMenu] = useState<ApiMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApiMenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [address, setAddress] = useState("");
  const [activeOrder, setActiveOrder] = useState<ApiOrder | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    foodApi.restaurant(id)
      .then((data) => { if (!cancelled) { setRestaurant(data.restaurant); setMenu(data.menu.filter((item) => item.is_available)); } })
      .catch((caught: Error) => { if (!cancelled) setError(caught.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!activeOrder?.order_id || ["delivered", "cancelled"].includes(activeOrder.order_status)) return;
    const timer = window.setInterval(() => {
      foodApi.order(activeOrder.order_id).then((order) => setActiveOrder(order as unknown as ApiOrder)).catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [activeOrder?.order_id, activeOrder?.order_status]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);

  const openItem = (item: ApiMenuItem) => {
    setSelectedItem(item);
    const initial: Record<string, string[]> = {};
    item.customization_groups.forEach((group) => { initial[group.group_id] = []; });
    setSelectedOptions(initial);
  };

  const toggleOption = (groupId: string, optionId: string, type: "radio" | "checkbox", max: number) => {
    setSelectedOptions((current) => {
      const values = current[groupId] || [];
      if (type === "radio") return { ...current, [groupId]: [optionId] };
      if (values.includes(optionId)) return { ...current, [groupId]: values.filter((id) => id !== optionId) };
      return values.length >= max ? current : { ...current, [groupId]: [...values, optionId] };
    });
  };

  const addToCart = () => {
    if (!selectedItem) return;
    const invalid = selectedItem.customization_groups.find((group) => {
      const count = selectedOptions[group.group_id]?.length || 0;
      return count < group.min_select || count > group.max_select;
    });
    if (invalid) { setError(`กรุณาเลือก ${invalid.title} ให้ครบ`); return; }
    const optionIds = Object.values(selectedOptions).flat();
    const extra = selectedItem.customization_groups.flatMap((group) => group.options).filter((option) => optionIds.includes(option.option_id)).reduce((sum, option) => sum + Number(option.extra_price), 0);
    setCart((current) => [...current, { ...selectedItem, quantity: 1, optionIds, unitPrice: Number(selectedItem.base_price) + extra }]);
    setSelectedItem(null);
    setError("");
  };

  const placeOrder = async () => {
    if (!restaurant || !cart.length || !address.trim()) { setError("กรุณาระบุที่อยู่จัดส่ง"); return; }
    setSubmitting(true);
    setError("");
    try {
      const guest = await ensureGuestCustomer(address.trim());
      const order = await foodApi.post<ApiOrder>({
        action: "create_order",
        customer_id: guest.customerId,
        restaurant_id: restaurant.restaurant_id,
        address_id: guest.addressId,
        payment_method: "เงินสดปลายทาง",
        items: cart.map((item) => ({ menu_item_id: item.menu_item_id, quantity: item.quantity, option_ids: item.optionIds })),
      });
      setActiveOrder(order);
      setCart([]);
      setCheckoutOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ส่งออเดอร์ไม่สำเร็จ");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-400"><i className="fas fa-spinner animate-spin text-3xl" /></div>;
  if (!restaurant) return <div className="mx-auto max-w-xl p-10 text-center"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error || "ไม่พบร้านอาหาร"}</p><Link to="/shop" className="mt-5 inline-block text-primary">กลับหน้าร้าน</Link></div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link to="/shop" className="font-bold text-slate-500"><i className="fas fa-arrow-left mr-2" />ร้านอาหาร</Link><div className="flex items-center gap-3"><button onClick={() => setCheckoutOpen(true)} className="rounded-xl bg-primary px-4 py-2.5 font-bold text-white"><i className="fas fa-basket-shopping mr-2" />ตะกร้า ({cart.length})</button><button onClick={() => { authApi.logoutUser(); navigate("/", { replace: true }); }} className="rounded-xl border border-red-200 px-3 py-2.5 font-bold text-red-600" title="ออกจากระบบ"><i className="fas fa-right-from-bracket" /></button></div></div></header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="overflow-hidden rounded-3xl bg-slate-900 text-white"><img src={restaurant.image_url} alt={restaurant.name} className="h-64 w-full object-cover opacity-70" /><div className="p-7"><h1 className="text-3xl font-black">{restaurant.name}</h1><p className="mt-2 text-sm text-slate-300"><i className="fas fa-star mr-1 text-amber-400" />{Number(restaurant.rating).toFixed(1)} · {restaurant.delivery_min_minutes}-{restaurant.delivery_max_minutes} นาที</p></div></div>
        {activeOrder && <div className="mt-7 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"><p className="text-sm font-bold text-primary">ออเดอร์ #{activeOrder.order_number}</p><h2 className="mt-1 text-xl font-black">สถานะ: {({ received: "รับออเดอร์แล้ว", preparing: "กำลังปรุง", delivering: "กำลังจัดส่ง", delivered: "ส่งสำเร็จ", cancelled: "ยกเลิก" } as Record<string, string>)[activeOrder.order_status]}</h2><p className="mt-2 text-xs text-slate-400">สถานะอัปเดตจาก backend โดยอัตโนมัติ</p></div>}
        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{menu.map((item) => <button key={item.menu_item_id} onClick={() => openItem(item)} className="overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><img src={item.image_url} alt={item.name} className="h-44 w-full object-cover" /><div className="p-5"><h2 className="font-black">{item.name}</h2><p className="mt-2 font-bold text-primary">฿{Number(item.base_price).toFixed(0)}</p></div></button>)}</div>
        {!menu.length && <p className="py-20 text-center text-slate-400">ร้านนี้ยังไม่มีเมนูพร้อมขาย</p>}
      </section>

      {selectedItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"><div className="flex justify-between"><div><h2 className="text-xl font-black">{selectedItem.name}</h2><p className="text-primary">฿{Number(selectedItem.base_price).toFixed(0)}</p></div><button onClick={() => setSelectedItem(null)}><i className="fas fa-xmark text-xl" /></button></div><div className="mt-6 space-y-6">{selectedItem.customization_groups.map((group) => <div key={group.group_id}><p className="mb-3 font-bold">{group.title}{group.is_required && <span className="ml-1 text-primary">*</span>}</p><div className="space-y-2">{group.options.map((option) => <label key={option.option_id} className="flex cursor-pointer items-center justify-between rounded-xl border p-3"><span><input type={group.selection_type} name={group.group_id} checked={(selectedOptions[group.group_id] || []).includes(option.option_id)} onChange={() => toggleOption(group.group_id, option.option_id, group.selection_type, group.max_select)} className="mr-3 accent-red-600" />{option.name}</span><span>+฿{Number(option.extra_price)}</span></label>)}</div></div>)}</div><button onClick={addToCart} className="mt-7 w-full rounded-xl bg-primary py-3.5 font-bold text-white">เพิ่มลงตะกร้า</button></div></div>}

      {checkoutOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-black">ยืนยันออเดอร์</h2><button onClick={() => setCheckoutOpen(false)}><i className="fas fa-xmark text-xl" /></button></div><div className="mt-5 max-h-52 space-y-3 overflow-y-auto">{cart.map((item, index) => <div key={`${item.menu_item_id}-${index}`} className="flex justify-between rounded-xl bg-slate-50 p-3"><span>{item.name}</span><span className="font-bold">฿{item.unitPrice}</span></div>)}</div><label className="mt-5 block text-sm font-bold">ที่อยู่จัดส่ง<input value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-primary" placeholder="กรอกที่อยู่จัดส่ง" /></label><div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><i className="fas fa-money-bill-wave mr-2" />ชำระเงินสดปลายทาง</div><div className="mt-5 flex items-center justify-between"><strong>รวม ฿{subtotal.toFixed(0)}</strong><button disabled={submitting || !cart.length} onClick={() => void placeOrder()} className="rounded-xl bg-primary px-6 py-3 font-bold text-white disabled:opacity-50">{submitting ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์"}</button></div></div></div>}
    </main>
  );
}
