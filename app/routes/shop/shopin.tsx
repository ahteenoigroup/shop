import { useState, useEffect, useMemo } from "react";
import type { Route } from "./+types/shopin";

// Mock Data
const categories = [
  { id: "all", name: "ทั้งหมด", icon: "fa-utensils" },
  { id: "popular", name: "ยอดนิยม", icon: "fa-fire" },
  { id: "rice", name: "อาหารจานเดียว", icon: "fa-bowl-rice" },
  { id: "noodle", name: "ก๋วยเตี๋ยว", icon: "fa-bowl-food" },
  { id: "drink", name: "เครื่องดื่ม", icon: "fa-mug-hot" },
  { id: "dessert", name: "ของหวาน", icon: "fa-ice-cream" },
];

const menuItems = [
  { id: 1, name: "ผัดกะเพราหมูสับไข่ดาว", price: 60, category: "rice", image: "https://images.unsplash.com/photo-1626804475297-41609ea004bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8 },
  { id: 2, name: "ข้าวมันไก่ต้ม", price: 50, category: "rice", image: "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.5 },
  { id: 3, name: "ก๋วยเตี๋ยวเรือหมูน้ำตก", price: 45, category: "noodle", image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9 },
  { id: 4, name: "ผัดไทยกุ้งสด", price: 70, category: "noodle", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7 },
  { id: 5, name: "ข้าวไข่เจียวหมูสับ", price: 40, category: "rice", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.2 },
  { id: 6, name: "ชาไข่มุกบราวน์ชูการ์", price: 45, category: "drink", image: "https://images.unsplash.com/photo-1558855567-1a440618481b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.6 },
  { id: 7, name: "กาแฟอเมริกาโน่เย็น", price: 55, category: "drink", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.4 },
  { id: 8, name: "บิงซูสตรอว์เบอร์รี", price: 159, category: "dessert", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8 },
  { id: 9, name: "ข้าวผัดต้มยำทะเล", price: 80, category: "rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5 },
  { id: 10, name: "บะหมี่หมูแดง", price: 50, category: "noodle", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.3 },
  { id: 11, name: "น้ำส้มคั้นสด", price: 40, category: "drink", image: "https://images.unsplash.com/photo-1600271886742-f049cd451b02?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.1 },
  { id: 12, name: "ข้าวเหนียวมะม่วง", price: 100, category: "dessert", image: "https://images.unsplash.com/photo-1605615715509-fcd199b005bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9 },
];

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "อิ่มอร่อย Delivery" },
    { name: "description", content: "สั่งอาหารอร่อยๆ จากร้านดังมากมาย พร้อมโปรโมชั่นส่งฟรี" },
  ];
}

type CartItem = (typeof menuItems)[0] & {
  quantity: number;
};

export default function ShopIn({ params }: Route.ComponentProps) {
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("deliveryCart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("deliveryCart", JSON.stringify(cart));
  }, [cart]);

  // Derived State
  const filteredItems = useMemo(() => {
    let items = menuItems;
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 0; // Free delivery
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handlers
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (itemId: number) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast("กรุณาเลือกอาหารก่อนทำการสั่งซื้อ");
      return;
    }
    setIsCartOpen(false);
    setOrderNumber(Math.floor(100000 + Math.random() * 900000).toString());
    setIsCheckoutModalOpen(true);
    setCart([]);
  };

  const closeCheckoutModal = () => setIsCheckoutModalOpen(false);

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
                อิ่มอร่อย <span className="text-primary">{params.id}</span>
              </span>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาเมนูอาหาร..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-search"></i>
                </div>
              </div>
            </div>

            {/* Cart Button */}
            <div className="flex items-center">
              <button onClick={toggleCart} className="relative p-2 text-gray-600 hover:text-primary transition">
                <i className="fas fa-shopping-cart text-xl"></i>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="md:hidden ml-4 p-2 text-gray-600">
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
              placeholder="ค้นหาเมนูอาหาร..."
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
                  <span className="block">จัดส่งอาหาร</span>
                  <span className="block text-primary">ถึงหน้าบ้านคุณ</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  สั่งอาหารอร่อยๆ จากร้านดังมากมาย พร้อมโปรโมชั่นส่งฟรี พิเศษสุดๆ สำหรับลูกค้าใหม่
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a
                      href="#menu-section"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-hover md:py-4 md:text-lg transition"
                    >
                      สั่งเลย
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
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80"
            alt="Food background"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="menu-section">
        {/* Categories */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 border-l-4 border-primary pl-3">หมวดหมู่แนะนำ</h2>
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

        {/* Food Grid */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">
              {searchQuery ? `ผลการค้นหาสำหรับ "${searchQuery}"` : categories.find((c) => c.id === currentCategory)?.name}
            </h2>
            <div className="text-sm text-gray-500 hidden sm:block">
              เรียงตาม:{" "}
              <select className="bg-transparent border-b border-gray-300 focus:outline-none">
                <option>แนะนำ</option>
                <option>ราคา ต่ำ-สูง</option>
                <option>ราคา สูง-ต่ำ</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl text-gray-600 font-medium">ไม่พบเมนูที่ค้นหา</h3>
              <p className="text-gray-400 mt-2">ลองใช้คำค้นหาอื่น หรือเลือกดูหมวดหมู่ของเรา</p>
              <button
                onClick={() => setCurrentCategory("all")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition"
              >
                ดูเมนูทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="food-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {item.popular && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                        <i className="fas fa-fire mr-1"></i> ยอดฮิต
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">{item.name}</h3>
                      <div className="flex items-center text-sm text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                        <i className="fas fa-star mr-1 text-xs"></i> {item.rating}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 mt-auto">จัดส่งใน 30 นาที</p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="font-bold text-xl text-primary">฿{item.price}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-10 h-10 rounded-full bg-gray-100 text-primary hover:bg-primary hover:text-white transition flex items-center justify-center focus:outline-none"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <i className="fas fa-utensils text-primary text-2xl mr-2"></i>
                <span className="font-bold text-xl">อิ่มอร่อย</span>
              </div>
              <p className="text-gray-400 text-sm">
                บริการส่งอาหารออนไลน์ รวดเร็ว ทันใจ ส่งตรงถึงมือคุณ พร้อมเมนูให้เลือกหลากหลาย
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">เกี่ยวกับเรา</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition">
                    ประวัติบริษัท
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    ร่วมงานกับเรา
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    นักลงทุนสัมพันธ์
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">ช่วยเหลือ</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition">
                    ศูนย์ช่วยเหลือ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    คำถามที่พบบ่อย
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    นโยบายความเป็นส่วนตัว
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">ติดตามเรา</h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-primary transition"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-primary transition"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-primary transition"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            &copy; 2026 อิ่มอร่อย Delivery. สงวนลิขสิทธิ์.
          </div>
        </div>
      </footer>

      {/* Shopping Cart Overlay & Sidebar */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-40 transition-opacity"
          onClick={toggleCart}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 cart-slide shadow-2xl flex flex-col ${
          isCartOpen ? "cart-open" : "cart-closed"
        }`}
      >
        {/* Cart Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-dark">
            <i className="fas fa-shopping-cart text-primary mr-2"></i> ตะกร้าสินค้า
          </h2>
          <button onClick={toggleCart} className="text-gray-500 hover:text-red-500 transition p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <i className="fas fa-basket-shopping text-5xl mb-4 text-gray-300"></i>
              <p>ตะกร้าของคุณว่างเปล่า</p>
              <p className="text-sm mt-2">เลือกเมนูอร่อยๆ เลย!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-primary font-medium text-sm">฿{item.price}</span>
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">ค่าอาหาร</span>
            <span className="font-medium">฿{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-gray-600">ค่าจัดส่ง</span>
            <span className="font-medium text-green-600">ฟรี</span>
          </div>
          <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-200">
            <span className="text-lg font-bold">ยอดสุทธิ</span>
            <span className="text-2xl font-bold text-primary">฿{total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition shadow-md flex justify-center items-center"
          >
            ดำเนินการสั่งซื้อ <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      <div
        className={`fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 flex items-center ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <i className="fas fa-check-circle text-green-400 mr-2"></i>
        <span>{toastMessage}</span>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center transform transition-all scale-100 opacity-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-4xl text-green-500"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">สั่งซื้อสำเร็จ!</h2>
            <p className="text-gray-600 mb-6">
              อาหารของคุณกำลังเตรียมจัดส่ง
              <br />
              จะถึงหน้าบ้านภายใน 30-45 นาที
            </p>
            <p className="text-sm text-gray-500 mb-6">หมายเลขคำสั่งซื้อ: #{orderNumber}</p>
            <button
              onClick={closeCheckoutModal}
              className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-hover transition"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
