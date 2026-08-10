import type { AdminEntity } from "../../lib/admin-api";

export type TabId =
  | "dashboard"
  | "orders"
  | "categories"
  | "restaurants"
  | "menu_items"
  | "customers"
  | "addresses"
  | "riders"
  | "payments";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
};

export const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "ภาพรวม", icon: "fa-chart-pie" },
  { id: "orders", label: "ออเดอร์", icon: "fa-receipt" },
  { id: "categories", label: "หมวดหมู่ร้าน", icon: "fa-tags" },
  { id: "restaurants", label: "ร้านอาหาร", icon: "fa-store" },
  { id: "menu_items", label: "เมนูอาหาร", icon: "fa-bowl-food" },
  { id: "customers", label: "ลูกค้า", icon: "fa-users" },
  { id: "addresses", label: "ที่อยู่จัดส่ง", icon: "fa-location-dot" },
  { id: "riders", label: "ไรเดอร์", icon: "fa-motorcycle" },
  { id: "payments", label: "การชำระเงิน", icon: "fa-credit-card" },
];

export const entityMeta: Record<
  Exclude<TabId, "dashboard" | "orders" | "payments">,
  { entity: AdminEntity; id: string; title: string; fields: FieldConfig[] }
> = {
  categories: {
    entity: "categories", id: "category_id", title: "หมวดหมู่ร้าน",
    fields: [
      { key: "name_th", label: "ชื่อหมวดหมู่", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "icon", label: "ไอคอน" },
      { key: "is_active", label: "เปิดใช้งาน", type: "boolean" },
    ],
  },
  restaurants: {
    entity: "restaurants", id: "restaurant_id", title: "ร้านอาหาร",
    fields: [
      { key: "category_id", label: "รหัสหมวดหมู่", required: true },
      { key: "name", label: "ชื่อร้าน", required: true },
      { key: "rating", label: "คะแนน", type: "number", min: 0, max: 5 },
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
      { key: "rating", label: "คะแนน", type: "number", min: 0, max: 5 },
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
  addresses: {
    entity: "addresses", id: "address_id", title: "ที่อยู่จัดส่ง",
    fields: [
      { key: "customer_id", label: "รหัสลูกค้า", required: true },
      { key: "label", label: "ป้ายชื่อที่อยู่", required: true },
      { key: "recipient_name", label: "ชื่อผู้รับ", required: true },
      { key: "phone", label: "เบอร์โทรศัพท์", required: true },
      { key: "address_line", label: "รายละเอียดที่อยู่", required: true },
      { key: "subdistrict", label: "แขวง/ตำบล" },
      { key: "district", label: "เขต/อำเภอ" },
      { key: "province", label: "จังหวัด", required: true },
      { key: "postal_code", label: "รหัสไปรษณีย์" },
      { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90 },
      { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180 },
      { key: "is_default", label: "ที่อยู่หลัก", type: "boolean" },
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
        { value: "available", label: "ยังไม่ได้รับ Order" },
        { value: "assigned", label: "ได้รับ Order แล้ว" },
        { value: "offline", label: "ออฟไลน์" },
      ] },
    ],
  },
};

export const orderStatusLabels: Record<string, string> = {
  received: "รับออเดอร์แล้ว", preparing: "กำลังปรุง", delivering: "กำลังจัดส่ง",
  delivered: "ส่งสำเร็จ", cancelled: "ยกเลิก",
};
