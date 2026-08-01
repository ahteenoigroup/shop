import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { authApi } from "../../lib/auth-api";
import { foodApi, type ApiRestaurant } from "../../lib/food-api";

export default function Shop() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    foodApi.restaurants()
      .then((data) => { if (!cancelled) setRestaurants(data.filter((item) => item.is_active)); })
      .catch((caught: Error) => { if (!cancelled) setError(caught.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => Array.from(new Set(restaurants.map((item) => item.category).filter(Boolean))), [restaurants]);
  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return restaurants.filter((item) =>
      (category === "all" || item.category === category) &&
      (!query || [item.name, item.category].some((value) => String(value || "").toLowerCase().includes(query))),
    );
  }, [restaurants, search, category]);

  const logout = () => { authApi.logoutUser(); navigate("/", { replace: true }); };

  return (
    <main className="min-h-screen bg-[#fffaf7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/shop" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-200"><i className="fas fa-utensils" /></span>
            <span className="text-lg font-black tracking-tight">อาตี๋น้อย <span className="text-red-500">Delivery</span></span>
          </Link>
          <button onClick={logout} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600"><i className="fas fa-right-from-bracket mr-2" />ออกจากระบบ</button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-400 text-white">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-white/10" /><div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-orange-300/20 blur-2xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25"><i className="fas fa-bolt mr-2" />ส่งไว อร่อยถึงบ้าน</span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">มื้ออร่อยของคุณ<br /><span className="text-orange-100">เริ่มต้นที่นี่</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-red-50 sm:text-base">เลือกร้านโปรด ดูเมนู และสั่งอาหารได้ง่ายในไม่กี่ขั้นตอน</p>
          <div className="mt-8 flex max-w-2xl items-center rounded-2xl bg-white p-2 shadow-2xl shadow-red-900/20">
            <i className="fas fa-magnifying-glass ml-3 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาร้านอาหารหรือประเภทอาหาร" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-100"><i className="fas fa-xmark" /></button>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold text-red-500">ร้านใกล้คุณ</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">วันนี้อยากกินอะไร?</h2></div>
          <p className="text-sm text-slate-400">พบ {items.length} ร้าน</p>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setCategory("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category === "all" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-red-500"}`}>ทั้งหมด</button>
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-red-500"}`}>{item}</button>)}
        </div>
        {error && <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"><i className="fas fa-circle-exclamation mr-2" />{error}</div>}
        {loading ? <div className="py-24 text-center text-slate-400"><i className="fas fa-spinner animate-spin text-3xl text-red-500" /><p className="mt-3">กำลังโหลดร้านอาหาร...</p></div> : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => <Link key={item.restaurant_id} to={`/shop/${item.restaurant_id}`} className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-100"><div className="relative overflow-hidden"><img src={item.image_url} alt={item.name} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />{item.is_popular && <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white shadow"><i className="fas fa-fire mr-1" />ยอดนิยม</span>}<span className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-2.5 py-1.5 text-xs font-black text-slate-800 shadow"><i className="fas fa-star mr-1 text-amber-400" />{Number(item.rating).toFixed(1)}</span></div><div className="p-5"><h3 className="truncate text-lg font-black group-hover:text-red-500">{item.name}</h3><p className="mt-1 text-xs text-slate-400">{item.category}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span><i className="far fa-clock mr-1.5 text-red-400" />{item.delivery_min_minutes}-{item.delivery_max_minutes} นาที</span><span><i className="fas fa-location-dot mr-1.5 text-red-400" />{Number(item.distance_km).toFixed(1)} กม.</span></div></div></Link>)}
          </div>
        )}
        {!loading && !error && !items.length && <div className="py-24 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl text-orange-300"><i className="fas fa-bowl-food" /></span><p className="mt-4 font-bold text-slate-500">ไม่พบร้านอาหาร</p><button onClick={() => { setSearch(""); setCategory("all"); }} className="mt-2 text-sm font-bold text-red-500">ล้างตัวกรอง</button></div>}
      </section>
    </main>
  );
}
