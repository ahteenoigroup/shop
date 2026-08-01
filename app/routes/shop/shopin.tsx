import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ensureGuestCustomer,
  foodApi,
  type ApiMenuItem,
  type ApiOrder,
  type ApiRestaurant,
} from "../../lib/food-api";
import { authApi } from "../../lib/auth-api";

type CartItem = ApiMenuItem & {
  quantity: number;
  optionIds: string[];
  unitPrice: number;
};

export default function ShopDetail() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
  const [menu, setMenu] = useState<ApiMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApiMenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [activeOrder, setActiveOrder] = useState<ApiOrder | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState("all");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    foodApi
      .restaurant(id)
      .then((data) => {
        if (!cancelled) {
          setRestaurant(data.restaurant);
          setMenu(data.menu.filter((item) => item.is_available));
        }
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (
      !activeOrder?.order_id ||
      ["delivered", "cancelled"].includes(activeOrder.order_status)
    )
      return;
    const timer = window.setInterval(() => {
      foodApi
        .order(activeOrder.order_id)
        .then((order) => setActiveOrder(order as unknown as ApiOrder))
        .catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [activeOrder?.order_id, activeOrder?.order_status]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );
  const menuCategories = useMemo(
    () =>
      Array.from(new Set(menu.map((item) => item.category).filter(Boolean))),
    [menu],
  );
  const filteredMenu = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    return menu.filter(
      (item) =>
        (menuCategory === "all" || item.category === menuCategory) &&
        (!query || item.name.toLowerCase().includes(query)),
    );
  }, [menu, menuCategory, menuSearch]);
  const selectedUnitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const optionIds = Object.values(selectedOptions).flat();
    const extra = selectedItem.customization_groups
      .flatMap((group) => group.options)
      .filter((option) => optionIds.includes(option.option_id))
      .reduce((sum, option) => sum + Number(option.extra_price), 0);
    return Number(selectedItem.base_price) + extra;
  }, [selectedItem, selectedOptions]);
  const updateQuantity = (index: number, change: number) =>
    setCart((current) =>
      current.flatMap((item, itemIndex) =>
        itemIndex !== index
          ? [item]
          : item.quantity + change > 0
            ? [{ ...item, quantity: item.quantity + change }]
            : [],
      ),
    );

  const openItem = (item: ApiMenuItem) => {
    setSelectedItem(item);
    const initial: Record<string, string[]> = {};
    item.customization_groups.forEach((group) => {
      initial[group.group_id] = [];
    });
    setSelectedOptions(initial);
    setSelectedQuantity(1);
  };

  const toggleOption = (
    groupId: string,
    optionId: string,
    type: "radio" | "checkbox",
    max: number,
  ) => {
    setSelectedOptions((current) => {
      const values = current[groupId] || [];
      if (type === "radio") return { ...current, [groupId]: [optionId] };
      if (values.includes(optionId))
        return {
          ...current,
          [groupId]: values.filter((id) => id !== optionId),
        };
      return values.length >= max
        ? current
        : { ...current, [groupId]: [...values, optionId] };
    });
  };

  const addToCart = () => {
    if (!selectedItem) return;
    const invalid = selectedItem.customization_groups.find((group) => {
      const count = selectedOptions[group.group_id]?.length || 0;
      return count < group.min_select || count > group.max_select;
    });
    if (invalid) {
      setError(`กรุณาเลือก ${invalid.title} ให้ครบ`);
      return;
    }
    const optionIds = Object.values(selectedOptions).flat();
    const extra = selectedItem.customization_groups
      .flatMap((group) => group.options)
      .filter((option) => optionIds.includes(option.option_id))
      .reduce((sum, option) => sum + Number(option.extra_price), 0);
    setCart((current) => [
      ...current,
      {
        ...selectedItem,
        quantity: selectedQuantity,
        optionIds,
        unitPrice: Number(selectedItem.base_price) + extra,
      },
    ]);
    setSelectedItem(null);
    setError("");
    setNotice(`เพิ่ม ${selectedItem.name} × ${selectedQuantity} ลงตะกร้าแล้ว`);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const placeOrder = async () => {
    if (!restaurant || !cart.length || !address.trim()) {
      setError("กรุณาระบุที่อยู่จัดส่ง");
      return;
    }
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
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          option_ids: item.optionIds,
        })),
      });
      setActiveOrder(order);
      setCart([]);
      setCheckoutOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "ส่งออเดอร์ไม่สำเร็จ",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <i className="fas fa-spinner animate-spin text-3xl" />
      </div>
    );
  if (!restaurant)
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-red-700">
          {error || "ไม่พบร้านอาหาร"}
        </p>
        <Link to="/shop" className="mt-5 inline-block text-primary">
          กลับหน้าร้าน
        </Link>
      </div>
    );

  return (
    <main className="min-h-screen bg-[#fffaf7] pb-24 text-slate-800 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            to="/shop"
            className="flex items-center gap-2 font-bold text-slate-600 transition hover:text-red-500"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <i className="fas fa-arrow-left" />
            </span>
            <span className="hidden sm:inline">เลือกร้านอื่น</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCheckoutOpen(true)}
              className="hidden rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow sm:block"
            >
              <i className="fas fa-basket-shopping mr-2" />
              ตะกร้า ({cartCount})
            </button>
            <button
              onClick={() => {
                authApi.logoutUser();
                navigate("/", { replace: true });
              }}
              className="rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50"
              title="ออกจากระบบ"
            >
              <i className="fas fa-right-from-bracket mr-0 sm:mr-2" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="h-72 w-full object-cover opacity-60 sm:h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                {restaurant.category}
              </span>
              {restaurant.is_popular && (
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold">
                  <i className="fas fa-fire mr-1" />
                  ยอดนิยม
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {restaurant.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-200">
              <span>
                <i className="fas fa-star mr-1.5 text-amber-400" />
                {Number(restaurant.rating).toFixed(1)}
              </span>
              <span>
                <i className="far fa-clock mr-1.5" />
                {restaurant.delivery_min_minutes}-
                {restaurant.delivery_max_minutes} นาที
              </span>
              <span>
                <i className="fas fa-location-dot mr-1.5" />
                {Number(restaurant.distance_km).toFixed(1)} กม.
              </span>
            </div>
          </div>
        </div>
        {activeOrder && (
          <div className="mt-7 flex items-start gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <i className="fas fa-motorcycle" />
            </span>
            <div>
              <p className="text-xs font-bold text-blue-600">
                ออเดอร์ #{activeOrder.order_number}
              </p>
              <h2 className="mt-1 text-lg font-black">
                {
                  (
                    {
                      received: "ร้านได้รับออเดอร์แล้ว",
                      preparing: "ร้านกำลังปรุงอาหาร",
                      delivering: "ไรเดอร์กำลังจัดส่ง",
                      delivered: "จัดส่งสำเร็จ",
                      cancelled: "ออเดอร์ถูกยกเลิก",
                    } as Record<string, string>
                  )[activeOrder.order_status]
                }
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                สถานะจะอัปเดตอัตโนมัติ
              </p>
            </div>
          </div>
        )}
        {error && (
          <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <i className="fas fa-circle-exclamation mr-2" />
            {error}
          </p>
        )}
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-red-500">เมนูทั้งหมด</p>
            <h2 className="mt-1 text-2xl font-black">เลือกเมนูอร่อย</h2>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <i className="fas fa-magnifying-glass absolute left-4 top-3.5 text-sm text-slate-400" />
            <input
              value={menuSearch}
              onChange={(event) => setMenuSearch(event.target.value)}
              placeholder="ค้นหาเมนู..."
              aria-label="ค้นหาเมนู"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setMenuCategory("all")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${menuCategory === "all" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
          >
            ทั้งหมด
          </button>
          {menuCategories.map((category) => (
            <button
              key={category}
              onClick={() => setMenuCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${menuCategory === category ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            พบ {filteredMenu.length} เมนู
          </p>
          {(menuSearch || menuCategory !== "all") && (
            <button
              onClick={() => {
                setMenuSearch("");
                setMenuCategory("all");
              }}
              className="text-xs font-bold text-red-500"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMenu.map((item) => (
            <button
              key={item.menu_item_id}
              onClick={() => openItem(item)}
              aria-label={`เลือกเมนู ${item.name} ราคา ${Number(item.base_price).toFixed(0)} บาท`}
              className="group flex overflow-hidden rounded-2xl border border-orange-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-100 sm:block"
            >
              <div className="relative w-32 shrink-0 overflow-hidden sm:w-auto">
                <img
                  src={item.image_url}
                  alt=""
                  className="h-full min-h-32 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48"
                />
                {item.is_popular && (
                  <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                    ขายดี
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-black group-hover:text-red-500">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{item.category}</p>
                  <p className="mt-3 text-lg font-black text-red-500">
                    ฿{Number(item.base_price).toFixed(0)}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition group-hover:bg-red-500 group-hover:text-white"
                >
                  <i className="fas fa-plus" />
                </span>
              </div>
            </button>
          ))}
        </div>
        {!filteredMenu.length && menu.length > 0 && (
          <div className="py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-300">
              <i className="fas fa-magnifying-glass" />
            </span>
            <p className="mt-4 font-bold text-slate-500">ไม่พบเมนูที่ค้นหา</p>
            <button
              onClick={() => {
                setMenuSearch("");
                setMenuCategory("all");
              }}
              className="mt-2 text-sm font-bold text-red-500"
            >
              ดูเมนูทั้งหมด
            </button>
          </div>
        )}
        {!menu.length && (
          <p className="py-20 text-center text-slate-400">
            ร้านนี้ยังไม่มีเมนูพร้อมขาย
          </p>
        )}
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-dialog-title"
        >
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">
            <div className="relative h-52 overflow-hidden sm:h-60">
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
              <button
                onClick={() => setSelectedItem(null)}
                aria-label="ปิดหน้าต่างเลือกเมนู"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-red-600 hover:text-white"
              >
                <i className="fas fa-xmark" />
              </button>
              <span className="absolute bottom-4 left-4 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                {selectedItem.category}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                    ปรับแต่งเมนู
                  </p>
                  <h2
                    id="menu-dialog-title"
                    className="mt-1 text-2xl font-black"
                  >
                    {selectedItem.name}
                  </h2>
                </div>
                <p className="shrink-0 text-xl font-black text-red-600">
                  ฿{selectedUnitPrice.toFixed(0)}
                </p>
              </div>
              <div className="mt-6 space-y-6">
                {selectedItem.customization_groups.map((group) => (
                  <div key={group.group_id}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-bold">
                        {group.title}
                        {group.is_required && (
                          <span className="ml-1 text-red-600">*</span>
                        )}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        เลือกได้ {group.max_select}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const checked = (
                          selectedOptions[group.group_id] || []
                        ).includes(option.option_id);
                        return (
                          <label
                            key={option.option_id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${checked ? "border-red-500 bg-red-50 ring-1 ring-red-100" : "border-slate-200 hover:border-red-300"}`}
                          >
                            <span>
                              <input
                                type={group.selection_type}
                                name={group.group_id}
                                checked={checked}
                                onChange={() =>
                                  toggleOption(
                                    group.group_id,
                                    option.option_id,
                                    group.selection_type,
                                    group.max_select,
                                  )
                                }
                                className="mr-3 accent-red-600"
                              />
                              {option.name}
                            </span>
                            <span className="text-sm font-bold">
                              +฿{Number(option.extra_price)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs text-slate-400">จำนวน</p>
                  <p className="text-sm font-bold">เลือกจำนวนที่ต้องการ</p>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-white p-1.5 shadow-sm">
                  <button
                    onClick={() =>
                      setSelectedQuantity((value) => Math.max(1, value - 1))
                    }
                    disabled={selectedQuantity === 1}
                    aria-label="ลดจำนวน"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 disabled:border-slate-200 disabled:text-slate-300"
                  >
                    <i className="fas fa-minus text-xs" />
                  </button>
                  <span
                    className="w-7 text-center text-lg font-black"
                    aria-live="polite"
                  >
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedQuantity((value) => Math.min(99, value + 1))
                    }
                    aria-label="เพิ่มจำนวน"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-200 transition hover:bg-red-700"
                  >
                    <i className="fas fa-plus text-xs" />
                  </button>
                </div>
              </div>
              <button
                onClick={addToCart}
                className="mt-4 flex w-full items-center justify-between rounded-xl bg-red-600 px-5 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
              >
                <span>
                  <i className="fas fa-basket-shopping mr-2" />
                  เพิ่มลงตะกร้า
                </span>
                <span>
                  ฿{(selectedUnitPrice * selectedQuantity).toFixed(0)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem]">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold text-red-500">ตะกร้าของคุณ</p>
                <h2 id="checkout-title" className="mt-1 text-xl font-black">
                  ตรวจสอบออเดอร์
                </h2>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                aria-label="ปิดตะกร้า"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                <i className="fas fa-xmark" />
              </button>
            </div>
            <div className="mt-5 max-h-60 space-y-3 overflow-y-auto">
              {cart.map((item, index) => (
                <div
                  key={`${item.menu_item_id}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    <p className="mt-1 text-xs font-bold text-red-500">
                      ฿{item.unitPrice * item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      aria-label={
                        item.quantity === 1
                          ? `ลบ ${item.name} ออกจากตะกร้า`
                          : `ลดจำนวน ${item.name}`
                      }
                      className="h-7 w-7 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500"
                    >
                      <i
                        className={`fas ${item.quantity === 1 ? "fa-trash" : "fa-minus"} text-xs`}
                      />
                    </button>
                    <span
                      className="w-5 text-center text-sm font-black"
                      aria-label={`จำนวน ${item.quantity}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      aria-label={`เพิ่มจำนวน ${item.name}`}
                      className="h-7 w-7 rounded-full bg-red-500 text-white"
                    >
                      <i className="fas fa-plus text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!cart.length && (
              <p className="py-10 text-center text-sm text-slate-400">
                ยังไม่มีเมนูในตะกร้า
              </p>
            )}
            <label className="mt-5 block text-sm font-bold">
              ที่อยู่จัดส่ง
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                placeholder="บ้านเลขที่ ถนน เขต/อำเภอ จังหวัด"
              />
            </label>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <i className="fas fa-money-bill-wave mr-2" />
              ชำระเงินสดปลายทาง
            </div>
            <div className="mt-5 flex items-center justify-between border-t pt-5">
              <div>
                <p className="text-xs text-slate-400">ยอดรวม</p>
                <strong className="text-2xl text-red-500">
                  ฿{subtotal.toFixed(0)}
                </strong>
              </div>
              <button
                disabled={submitting || !cart.length}
                onClick={() => void placeOrder()}
                className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {submitting ? "กำลังส่ง..." : "ยืนยันสั่งอาหาร"}
              </button>
            </div>
          </div>
        </div>
      )}
      {cartCount > 0 && !checkoutOpen && (
        <button
          onClick={() => setCheckoutOpen(true)}
          className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-2xl sm:hidden"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-black">
            {cartCount}
          </span>
          <strong>ดูตะกร้า</strong>
          <span>฿{subtotal.toFixed(0)}</span>
        </button>
      )}
      {notice && (
        <div
          className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl sm:bottom-6"
          role="status"
        >
          <i className="fas fa-circle-check mr-2" />
          {notice}
        </div>
      )}
    </main>
  );
}
