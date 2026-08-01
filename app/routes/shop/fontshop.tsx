import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { foodApi, type ApiRestaurant } from "../../lib/food-api";
import { authApi } from "../../lib/auth-api";

export default function Shop() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [search, setSearch] = useState("");
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

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? restaurants.filter((item) => [item.name, item.category].some((value) => String(value || "").toLowerCase().includes(query)))
      : restaurants;
  }, [restaurants, search]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link to="/" className="text-xl font-black"><span className="text-primary">อาตี๋น้อย</span> Delivery</Link>
          <div className="flex items-center gap-4"><Link to="/admin" className="text-sm font-bold text-slate-500 hover:text-primary">Admin</Link><button onClick={() => { authApi.logoutUser(); navigate("/", { replace: true }); }} className="text-sm font-bold text-red-600 hover:text-red-700"><i className="fas fa-right-from-bracket mr-2" />ออกจากระบบ</button></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold text-primary">ร้านอาหาร</p><h1 className="mt-1 text-3xl font-black">เลือกเมนูที่คุณชอบ</h1></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาร้านอาหาร..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-primary sm:max-w-sm" />
        </div>
        {error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <div className="py-24 text-center text-slate-400"><i className="fas fa-spinner animate-spin text-3xl" /><p className="mt-3">กำลังโหลดร้านอาหาร...</p></div> : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => <Link key={item.restaurant_id} to={`/shop/${item.restaurant_id}`} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-black">{item.name}</h2><span className="text-sm font-bold text-amber-500"><i className="fas fa-star mr-1" />{Number(item.rating).toFixed(1)}</span></div><p className="mt-2 text-xs text-slate-500">{item.delivery_min_minutes}-{item.delivery_max_minutes} นาที · {Number(item.distance_km).toFixed(1)} กม.</p></div></Link>)}
          </div>
        )}
        {!loading && !error && !items.length && <p className="py-24 text-center text-slate-400">ไม่พบร้านอาหาร</p>}
      </section>
    </main>
  );
}
