import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "อิ่มอร่อย Delivery - หน้าแรก" },
    { name: "description", content: "ยินดีต้อนรับสู่ อิ่มอร่อย Delivery บริการสั่งอาหารออนไลน์" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-dark">
          อิ่มอร่อย <span className="text-primary">Delivery</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          บริการส่งอาหารอร่อยๆ จากร้านดังมากมาย ตรงถึงมือคุณ รวดเร็ว ทันใจ
        </p>
        <div>
          <Link
            to="/shop"
            className="inline-block bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            <i className="fas fa-utensils mr-2"></i> เลือกร้านอาหารเลย
          </Link>
        </div>
      </div>
    </div>
  );
}
