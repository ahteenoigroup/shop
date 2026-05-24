import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/fontshop";

// Mock Data
const categories = [
  { id: "all", name: "ทั้งหมด", icon: "fa-utensils" },
  { id: "popular", name: "ยอดนิยม", icon: "fa-fire" },
  { id: "thai", name: "อาหารไทย", icon: "fa-leaf" },
  { id: "japanese", name: "อาหารญี่ปุ่น", icon: "fa-fish" },
  { id: "western", name: "อาหารตะวันตก", icon: "fa-hamburger" },
  { id: "dessert", name: "ของหวาน", icon: "fa-ice-cream" },
];

const restaurants = [
  { id: 1, name: "กะเพราตาแตก", rating: 4.8, category: "thai", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "25-30 นาที", distance: "1.2 กม." },
  { id: 2, name: "ซูชิขั้นเทพ", rating: 4.5, category: "japanese", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "30-40 นาที", distance: "2.5 กม." },
  { id: 3, name: "เตี๋ยวเรือคลองห้า", rating: 4.9, category: "thai", image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "15-20 นาที", distance: "0.8 กม." },
  { id: 4, name: "เบอร์เกอร์พรีเมียม", rating: 4.7, category: "western", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "20-30 นาที", distance: "1.5 กม." },
  { id: 5, name: "สเต็กริมทาง", rating: 4.2, category: "western", image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, deliveryTime: "30-45 นาที", distance: "3.2 กม." },
  { id: 6, name: "บิงซูหิมะ", rating: 4.6, category: "dessert", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "20-25 นาที", distance: "1.1 กม." },
  { id: 7, name: "ตำมั่วซั่ว", rating: 4.4, category: "thai", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, deliveryTime: "25-35 นาที", distance: "2.0 กม." },
  { id: 8, name: "ราเมงต้นตำรับ", rating: 4.8, category: "japanese", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, deliveryTime: "35-45 นาที", distance: "4.5 กม." },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "เลือกร้านอาหาร - อาตี๋น้อย Delivery" },
    { name: "description", content: "เลือกร้านอาหารที่คุณชื่นชอบ พร้อมส่งตรงถึงบ้าน" },
  ];
}

export default function FontShop({}: Route.ComponentProps) {
  // State
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Load active order on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("deliveryHistory");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        const active = history.find((o: any) => o.status !== "delivered");
        if (active) {
          setActiveOrder(active);
        }
      } catch (e) {}
    }
  }, []);

  // Derived State
  const filteredRestaurants = useMemo(() => {
    let items = restaurants;
    if (currentCategory !== "all") {
      if (currentCategory === "popular") {
        items = items.filter((item) => item.popular);
      } else {
        items = items.filter((item) => item.category === currentCategory);
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return items;
  }, [currentCategory, searchQuery]);

  // Handlers
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  return (
    <div className="text-gray-800 font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <i className="fas fa-utensils text-primary text-2xl mr-2"></i>
              <span className="font-bold text-xl text-dark">
                อาตี๋น้อย <span className="text-primary">Delivery</span>
              </span>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาร้านอาหาร..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-search"></i>
                </div>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-primary transition">
                <i className="fas fa-user text-xl"></i>
              </button>
              <button className="md:hidden p-2 text-gray-600">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาร้านอาหาร..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-dark overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-dark sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-10">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left text-white">
                <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                  <span className="block">เลือกร้านที่ชอบ</span>
                  <span className="block text-primary">สั่งเมนูที่ใช่</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  สั่งอาหารจากร้านดังมากมาย พร้อมโปรโมชั่นส่งฟรี พิเศษสุดๆ สำหรับลูกค้าใหม่
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a
                      href="#restaurant-section"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-hover md:py-4 md:text-lg transition"
                    >
                      ดูร้านอาหารทั้งหมด
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 opacity-50 lg:opacity-100">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"
            alt="Restaurant background"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="restaurant-section">
        {/* Categories */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 border-l-4 border-primary pl-3">หมวดหมู่อาหาร</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full border transition shadow-sm ${
                  cat.id === currentCategory
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                }`}
                onClick={() => {
                  setCurrentCategory(cat.id);
                  setSearchQuery("");
                }}
              >
                <i className={`fas ${cat.icon} mr-2`}></i>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Grid */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">
              {searchQuery ? `ผลการค้นหาสำหรับ "${searchQuery}"` : categories.find((c) => c.id === currentCategory)?.name}
            </h2>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl text-gray-600 font-medium">ไม่พบร้านอาหารที่ค้นหา</h3>
              <button
                onClick={() => setCurrentCategory("all")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition"
              >
                ดูร้านทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="food-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-lg transition"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                    {restaurant.popular && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                        <i className="fas fa-fire mr-1"></i> ยอดฮิต
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">{restaurant.name}</h3>
                      <div className="flex items-center text-sm text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                        <i className="fas fa-star mr-1 text-xs"></i> {restaurant.rating}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-2 mb-4 mt-auto">
                      <span>{categories.find(c => c.id === restaurant.category)?.name}</span>
                      <span>•</span>
                      <span>{restaurant.distance}</span>
                    </div>
                    <div className="flex justify-between items-center mt-auto border-t pt-3">
                      <div className="text-sm text-gray-500">
                        <i className="far fa-clock mr-1"></i> {restaurant.deliveryTime}
                      </div>
                      <Link to={`/shop/${restaurant.name}`} className="text-primary font-bold hover:underline">
                        เลือกร้าน <i className="fas fa-chevron-right ml-1 text-xs"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            &copy; 2026 อาตี๋น้อย Delivery. สงวนลิขสิทธิ์.
          </div>
        </div>
      </footer>

      {/* Active Order Tracking Floating Banner */}
      {activeOrder && (
        <Link
          to={`/shop/${activeOrder.shopName}`}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 z-50 flex items-center justify-between hover:scale-102 hover:bg-gray-800 transition duration-300 animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white p-2.5 rounded-full flex items-center justify-center animate-bounce">
              <i className="fas fa-motorcycle text-base"></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400">สั่งซื้อออเดอร์ในขั้นตอนจัดส่ง</p>
              <p className="text-xs font-extrabold text-white mt-0.5">
                {activeOrder.shopName} • {" "}
                <span className="text-green-400">
                  {activeOrder.status === "received" ? "รับออเดอร์แล้ว" :
                   activeOrder.status === "preparing" ? "กำลังปรุงอาหาร" :
                   activeOrder.status === "delivering" ? "กำลังนำส่งถึงบ้านคุณ..." : "ถึงแล้ว!"}
                </span>
              </p>
            </div>
          </div>
          <div className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition">
            <i className="fas fa-arrow-right"></i>
          </div>
        </Link>
      )}

      {/* Notification Toast */}
      <div
        className={`fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 flex items-center ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <i className="fas fa-check-circle text-green-400 mr-2"></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
