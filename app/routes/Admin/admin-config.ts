import type { AdminEntity } from "../../lib/admin-api";

export type TabId =
  | "dashboard"
  | "orders"
  | "restaurants"
  | "menu_items"
  | "customers"
  | "riders"
  | "payments";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
};

export const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "ภาพรวม", icon: "fa-chart-pie" },
  { id: "orders", label: "ออเดอร์", icon: "fa-receipt" },
  { id: "restaurants", label: "ร้านอาหาร", icon: "fa-store" },
  { id: "menu_items", label: "เมนูอาหาร", icon: "fa-bowl-food" },
  { id: "customers", label: "ลูกค้า", icon: "fa-users" },
  { id: "riders", label: "ไรเดอร์", icon: "fa-motorcycle" },
  { id: "payments", label: "การชำระเงิน", icon: "fa-credit-card" },
];

export const entityMeta: Record<
  Exclude<TabId, "dashboard" | "orders" | "payments">,
  { entity: AdminEntity; id: string; title: string; fields: FieldConfig[] }
> = {
  restaurants: {
    entity: "restaurants", id: "restaurant_id", title: "ร้านอาหาร",
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
    entity: "menu_items", id: "menu_item_id", title: "เมนูอาหาร",
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
    entity: "customers", id: "customer_id", title: "ลูกค้า",
    fields: [
      { key: "full_name", label: "ชื่อลูกค้า", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", required: true },
      { key: "email", label: "อีเมล" },
      { key: "is_active", label: "เปิดใช้งาน", type: "boolean" },
    ],
  },
  riders: {
    entity: "riders", id: "rider_id", title: "ไรเดอร์",
    fields: [
      { key: "full_name", label: "ชื่อไรเดอร์", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", required: true },
      { key: "vehicle_type", label: "ประเภทรถ" },
      { key: "license_plate", label: "ทะเบียนรถ" },
      { key: "status", label: "สถานะ", type: "select", options: [
        { value: "available", label: "พร้อมรับงาน" },
        { value: "assigned", label: "กำลังส่ง" },
        { value: "offline", label: "ออฟไลน์" },
      ] },
    ],
  },
};

export const orderStatusLabels: Record<string, string> = {
  received: "รับออเดอร์แล้ว", preparing: "กำลังปรุง", delivering: "กำลังจัดส่ง",
  delivered: "ส่งสำเร็จ", cancelled: "ยกเลิก",
};
