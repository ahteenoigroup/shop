import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/shopin";

// Restaurant Database (aligned with fontshop.tsx)
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

// Rich Menus mapped to specific Restaurant Categories
interface CustomizationGroup {
  title: string;
  type: "radio" | "checkbox";
  required?: boolean;
  options: { name: string; price: number }[];
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  popular: boolean;
  rating: number;
  category: string;
  customization?: CustomizationGroup[];
}

const thaiCustomization: CustomizationGroup[] = [
  {
    title: "ระดับความเผ็ด",
    type: "radio",
    required: true,
    options: [
      { name: "ไม่เผ็ดเลย (จืด)", price: 0 },
      { name: "เผ็ดน้อย (พริก 1-2 เม็ด)", price: 0 },
      { name: "เผ็ดปกติ (สูตรเด็ดร้าน)", price: 0 },
      { name: "เผ็ดตาแตก (พริก 10 เม็ด)", price: 5 },
    ]
  },
  {
    title: "เพิ่มท็อปปิ้งไข่",
    type: "checkbox",
    options: [
      { name: "ไข่ดาวกรอบ", price: 10 },
      { name: "ไข่เจียวฟู", price: 12 },
      { name: "ไข่เค็มมันๆ", price: 15 },
    ]
  },
  {
    title: "พิเศษเพิ่มเติม",
    type: "checkbox",
    options: [
      { name: "เพิ่มข้าวสวย", price: 15 },
      { name: "เพิ่มกับข้าว (พิเศษ)", price: 20 },
    ]
  }
];

const japaneseCustomization: CustomizationGroup[] = [
  {
    title: "เพิ่มเครื่องเคียงซูชิ/ราเมง",
    type: "checkbox",
    options: [
      { name: "ไข่ต้มออนเซ็น", price: 15 },
      { name: "ชาชูเพิ่มอีก 1 ชิ้น", price: 30 },
      { name: "สาหร่ายโนริเพิ่ม", price: 10 },
      { name: "ไข่กุ้งคำโต", price: 25 },
    ]
  },
  {
    title: "ระดับความหวาน/ซอส",
    type: "radio",
    required: true,
    options: [
      { name: "ซอสปกติ", price: 0 },
      { name: "เพิ่มซอสเข้มข้น", price: 10 },
      { name: "ลดโซเดียม (เค็มน้อย)", price: 0 },
    ]
  }
];

const burgerCustomization: CustomizationGroup[] = [
  {
    title: "เลือกความสุกของเนื้อ",
    type: "radio",
    required: true,
    options: [
      { name: "Medium Rare (ฉ่ำๆ)", price: 0 },
      { name: "Medium (นุ่มกำลังดี)", price: 0 },
      { name: "Well Done (สุกทั่วถึง)", price: 0 },
    ]
  },
  {
    title: "ท็อปปิ้งเบอร์เกอร์",
    type: "checkbox",
    options: [
      { name: "เพิ่มเชดดาร์ชีส 1 แผ่น", price: 15 },
      { name: "เพิ่มเบคอนกรอบ 2 ชิ้น", price: 25 },
      { name: "เพิ่มไข่ดาว", price: 10 },
    ]
  }
];

const dessertCustomization: CustomizationGroup[] = [
  {
    title: "เพิ่มความฟิน (ท็อปปิ้ง)",
    type: "checkbox",
    options: [
      { name: "เพิ่มไอศกรีมวานิลลา 1 ลูก", price: 30 },
      { name: "เพิ่มวิปครีมฟูนุ่ม", price: 15 },
      { name: "เพิ่มซอสสตรอว์เบอร์รีเข้มข้น", price: 10 },
      { name: "เพิ่มซอสมะม่วงทอง", price: 10 },
    ]
  },
  {
    title: "ระดับความหวาน",
    type: "radio",
    required: true,
    options: [
      { name: "หวานปกติ (100%)", price: 0 },
      { name: "หวานน้อย (50%)", price: 0 },
      { name: "ไม่หวานเลย (0%)", price: 0 },
    ]
  }
];

const shopMenus: Record<string, MenuItem[]> = {
  "กะเพราตาแตก": [
    { id: 101, name: "ผัดกะเพราหมูสับตาแตก", price: 60, image: "https://images.unsplash.com/photo-1626804475297-41609ea004bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "rice", customization: thaiCustomization },
    { id: 102, name: "ผัดกะเพราเนื้อโคขุนบดสับ", price: 85, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "rice", customization: thaiCustomization },
    { id: 103, name: "ผัดกะเพราทะเลเดือด (หมึก+กุ้ง)", price: 90, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "rice", customization: thaiCustomization },
    { id: 104, name: "ข้าวผัดพริกแกงหมูกรอบไข่ดาว", price: 75, image: "https://images.unsplash.com/photo-1626804475297-41609ea004bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5, category: "rice", customization: thaiCustomization },
    { id: 105, name: "ข้าวไข่เจียวฟูหมูสับทรงเครื่อง", price: 50, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.4, category: "rice", customization: thaiCustomization },
    { id: 106, name: "เกาเหลาต้มยำกระดูกอ่อน", price: 80, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "soup", customization: thaiCustomization },
    { id: 107, name: "น้ำลำไยสดดับร้อน", price: 35, image: "https://images.unsplash.com/photo-1600271886742-f049cd451b02?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.8, category: "drink" },
  ],
  "ซูชิขั้นเทพ": [
    { id: 201, name: "ซูชิเซ็ตรวมมหาเทพ (12 คำ)", price: 280, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "sushi", customization: japaneseCustomization },
    { id: 202, name: "ข้าวหน้าปลาแซลมอนดิบพรีเมียม (Sake Don)", price: 220, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "don", customization: japaneseCustomization },
    { id: 203, name: "แซลมอนซาชิมิสดแท้ (5 ชิ้นใหญ่)", price: 150, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "sushi" },
    { id: 204, name: "ข้าวแกงกะหรี่หมูทอดทงคัตสึด่วน", price: 160, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "don", customization: japaneseCustomization },
    { id: 205, name: "ทาโกยากิกรอบนอกนุ่มใน (6 ลูก)", price: 80, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5, category: "appetizer" },
    { id: 206, name: "ยำสาหร่ายเย็นฉ่ำ", price: 60, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.3, category: "appetizer" },
    { id: 207, name: "มัทฉะกรีนทีสัญชาติญี่ปุ่น", price: 45, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.7, category: "drink" },
  ],
  "เตี๋ยวเรือคลองห้า": [
    { id: 301, name: "ก๋วยเตี๋ยวเรือหมูน้ำตกสะท้านฟ้า", price: 45, image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "noodle", customization: thaiCustomization },
    { id: 302, name: "ก๋วยเตี๋ยวเรือเนื้อริบอายน้ำตกหอมฉุย", price: 65, image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "noodle", customization: thaiCustomization },
    { id: 303, name: "เกาเหลาหมูสไลด์รวมมิตร", price: 60, image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "noodle", customization: thaiCustomization },
    { id: 304, name: "ลูกชิ้นหมูปิ้งโบราณคัดพิเศษ (4 ไม้)", price: 50, image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "side" },
    { id: 305, name: "แคบหมูเกรดเอเจียวใหม่ๆ", price: 15, image: "https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.8, category: "side" },
    { id: 306, name: "ขนมถ้วยหวานมันกะทิ (คู่)", price: 20, image: "https://images.unsplash.com/photo-1605615715509-fcd199b005bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "dessert" },
    { id: 307, name: "น้ำโอเลี้ยงโบราณเข้มข้น", price: 25, image: "https://images.unsplash.com/photo-1558855567-1a440618481b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5, category: "drink" },
  ],
  "เบอร์เกอร์พรีเมียม": [
    { id: 401, name: "ดับเบิ้ลเบคอนชีสเบอร์เกอร์เนื้อแองกัส", price: 189, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "burger", customization: burgerCustomization },
    { id: 402, name: "เบอร์เกอร์หมูบาร์บีคิวรมควันชีส", price: 149, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "burger", customization: burgerCustomization },
    { id: 403, name: "เบอร์เกอร์ไก่กรอบเผ็ดซอสสไปซี่", price: 129, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "burger", customization: burgerCustomization },
    { id: 404, name: "เฟรนช์ฟรายส์จัมโบ้คลุกผงปาปริก้า", price: 79, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.5, category: "side" },
    { id: 405, name: "หอมใหญ่ทอดกรอบสูตรลับคันทรี่", price: 69, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.4, category: "side" },
    { id: 406, name: "โคล่าซ่าๆ เย็นเจี๊ยบสะใจ", price: 30, image: "https://images.unsplash.com/photo-1558855567-1a440618481b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.7, category: "drink" },
  ],
  "สเต็กริมทาง": [
    { id: 501, name: "สเต็กหมูพริกไทยดำกระทะร้อน", price: 99, image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.6, category: "steak", customization: burgerCustomization },
    { id: 502, name: "สเต็กเนื้อโคขุนริบอายน้ำจิ้มแจ่วสไตล์ไทย", price: 189, image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "steak", customization: burgerCustomization },
    { id: 503, name: "พอร์คช็อปซอสเห็ดครีมข้น", price: 139, image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.5, category: "steak", customization: burgerCustomization },
    { id: 504, name: "สเต็กไก่สไปซี่ดับเบิ้ลแมทช์", price: 89, image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.3, category: "steak", customization: burgerCustomization },
    { id: 505, name: "สลัดทูน่าสดซอสครีมส้มไข่กุ้ง", price: 69, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.4, category: "side" },
    { id: 506, name: "ซุปเห็ดแชมปิญองหอมกรุ่น", price: 49, image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.2, category: "side" },
  ],
  "บิงซูหิมะ": [
    { id: 601, name: "บิงซูสตรอว์เบอร์รีชีสพายอลังการ", price: 189, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "dessert", customization: dessertCustomization },
    { id: 602, name: "บิงซูมะม่วงน้ำดอกไม้สุกสีทอง", price: 179, image: "https://images.unsplash.com/photo-1605615715509-fcd199b005bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "dessert", customization: dessertCustomization },
    { id: 603, name: "บิงซูชาไทยเข้มข้นเฉาก๊วยหนึบ", price: 169, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.7, category: "dessert", customization: dessertCustomization },
    { id: 604, name: "ซิกเนเจอร์ฮันนี่โทสต์เนยสดล้นๆ", price: 149, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "dessert", customization: dessertCustomization },
    { id: 605, name: "ข้าวเหนียวมะม่วงจัดจานใหญ่", price: 120, image: "https://images.unsplash.com/photo-1605615715509-fcd199b005bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "dessert" },
    { id: 606, name: "ชานมไข่มุกบราวน์ชูการ์ซุปเปอร์เฮาส์", price: 65, image: "https://images.unsplash.com/photo-1558855567-1a440618481b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "drink", customization: dessertCustomization },
  ],
  "ตำมั่วซั่ว": [
    { id: 701, name: "ส้มตำถาดทะเลแหกเผ็ดซี๊ด", price: 159, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "somtum", customization: thaiCustomization },
    { id: 702, name: "ส้มตำไทยไข่เค็มนัวกะทิ", price: 65, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.6, category: "somtum", customization: thaiCustomization },
    { id: 703, name: "คอหมูย่างถ่านเนื้อนุ่มน้ำจิ้มแจ่วจัดจ้าน", price: 95, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "side" },
    { id: 704, name: "ลาบหมูคลุกผักแพวสไตล์อีสานแท้", price: 80, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5, category: "side", customization: thaiCustomization },
    { id: 705, name: "ต้มแซ่บกระดูกอ่อนหมูหม้อไฟร้อนแรง", price: 110, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.7, category: "soup", customization: thaiCustomization },
    { id: 706, name: "ปีกไก่ทอดน้ำปลาละมุนลิ้น (5 ชิ้น)", price: 85, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "side" },
  ],
  "ราเมงต้นตำรับ": [
    { id: 801, name: "ทงคัตสึชาริวราเมงซุปกระดูกเข้มข้น", price: 149, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.9, category: "ramen", customization: japaneseCustomization },
    { id: 802, name: "ราเมงแกงกะหรี่รสจัดจ้านไข่ออนเซ็น", price: 169, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.7, category: "ramen", customization: japaneseCustomization },
    { id: 803, name: "มิโซะราเมงชาชูชิ้นโตคู่ไผ่หมัก", price: 139, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "ramen", customization: japaneseCustomization },
    { id: 804, name: "ราเมงแห้งคลุกซอสสไปซี่สูตรเผ็ดร้อน", price: 139, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: true, rating: 4.8, category: "ramen", customization: japaneseCustomization },
    { id: 805, name: "เกี๊ยวซ่าญี่ปุ่นทอดกรอบซอสเค็มหวาน (5 ชิ้น)", price: 69, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.5, category: "appetizer" },
    { id: 806, name: "ชาเขียวมัทฉะญี่ปุ่นเย็นเจี๊ยบ", price: 40, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60", popular: false, rating: 4.6, category: "drink" },
  ]
};

// Interface for items in the shopping cart
interface CartItem {
  cartId: string; // unique configuration ID
  id: number;
  name: string;
  price: number; // final computed unit price including customization options
  basePrice: number;
  image: string;
  quantity: number;
  customization?: {
    spiciness?: string;
    meat?: string;
    extras: { name: string; price: number }[];
  };
}

interface OrderRecord {
  orderNumber: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  address: string;
  paymentMethod: string;
  date: string;
  status: "received" | "preparing" | "delivering" | "delivered";
}

export function meta({ params }: Route.MetaArgs) {
  const shopName = params.id ? decodeURIComponent(params.id) : "อาตี๋น้อย Delivery";
  return [
    { title: `${shopName} - สั่งอาหารออนไลน์ อาตี๋น้อย Delivery` },
    { name: "description", content: `สั่งอาหารอร่อยๆ สดใหม่ รสเด็ด จากร้าน ${shopName} ส่งตรงถึงมือคุณอย่างรวดเร็ว` },
  ];
}

export default function ShopIn({ params }: Route.ComponentProps) {
  const shopNameDecoded = decodeURIComponent(params.id || "");
  
  // Resolve current active restaurant
  const currentRestaurant = useMemo(() => {
    return restaurants.find(
      (r) => r.name === shopNameDecoded || r.id.toString() === shopNameDecoded
    ) || restaurants[0];
  }, [shopNameDecoded]);

  // Derived current menu items
  const menuItems = useMemo(() => {
    return shopMenus[currentRestaurant.name] || shopMenus["กะเพราตาแตก"];
  }, [currentRestaurant]);

  // Derived Categories based on actual menu items present
  const dynamicCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(menuItems.map((item) => item.category)));
    const catList = [
      { id: "all", name: "ทั้งหมด", icon: "fa-utensils" },
      { id: "popular", name: "ยอดนิยม", icon: "fa-fire" },
    ];
    
    uniqueCats.forEach((cat) => {
      let name = cat;
      let icon = "fa-bowl-food";
      if (cat === "rice") { name = "อาหารจานเดียว"; icon = "fa-bowl-rice"; }
      else if (cat === "sushi") { name = "ซูชิสดอร่อย"; icon = "fa-fish"; }
      else if (cat === "don") { name = "ข้าวหน้าญี่ปุ่น"; icon = "fa-bowl-rice"; }
      else if (cat === "noodle") { name = "ก๋วยเตี๋ยวแซ่บ"; icon = "fa-bowl-food"; }
      else if (cat === "burger") { name = "เบอร์เกอร์พรีเมียม"; icon = "fa-hamburger"; }
      else if (cat === "steak") { name = "สเต็กจานร้อน"; icon = "fa-utensils"; }
      else if (cat === "dessert") { name = "ของหวานเด็ด"; icon = "fa-ice-cream"; }
      else if (cat === "drink") { name = "เครื่องดื่มชื่นใจ"; icon = "fa-mug-hot"; }
      else if (cat === "side" || cat === "appetizer") { name = "ของทานเล่น"; icon = "fa-cookie-bite"; }
      else if (cat === "somtum") { name = "ส้มตำอีสาน"; icon = "fa-pepper-hot"; }
      else if (cat === "soup") { name = "ต้ม/ซุปแซ่บ"; icon = "fa-fire"; }
      
      catList.push({ id: cat, name, icon });
    });
    
    return catList;
  }, [menuItems]);

  // States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Advanced States
  // 1. Food Customization Modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSpiciness, setSelectedSpiciness] = useState<string>("");
  const [selectedMeat, setSelectedMeat] = useState<string>("");
  const [selectedMeatPrice, setSelectedMeatPrice] = useState<number>(0);
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [customizationQuantity, setCustomizationQuantity] = useState<number>(1);

  // 2. Interactive Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState<string[]>([
    "บ้าน (123/45 หมู่บ้านแสนสุข ซอย 5 กรุงเทพมหานคร 10250)",
    "ที่ทำงาน (อาคารคอมพิวเตอร์ทาวเวอร์ ชั้น 18 ถนนสุขุมวิท กรุงเทพฯ)",
  ]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [newAddressText, setNewAddressText] = useState("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "cash">("qr");

  // 3. PromptPay Simulator
  const [promptPaySeconds, setPromptPaySeconds] = useState<number>(300); // 5 mins
  const [isQRConfirmed, setIsQRConfirmed] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // 4. Live Order Tracking Simulator
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [simulatedTimeRemaining, setSimulatedTimeRemaining] = useState<number>(30); // 30 minutes simulated
  const [simulationSpeed, setSimulationSpeed] = useState<"accelerated" | "realtime">("accelerated");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "rider"; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Order history
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const promptPayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage
  useEffect(() => {
    // Load Cart
    const savedCart = localStorage.getItem("deliveryCart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    // Load Addresses
    const savedAddresses = localStorage.getItem("deliveryAddresses");
    if (savedAddresses) {
      try {
        setDeliveryAddresses(JSON.parse(savedAddresses));
      } catch (e) {}
    }

    // Load History & Active Order
    const savedHistory = localStorage.getItem("deliveryHistory");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setOrderHistory(parsed);
        // Find if there is an active order (status !== 'delivered')
        const active = parsed.find((o: OrderRecord) => o.status !== "delivered");
        if (active) {
          setActiveOrder(active);
          setupOrderSimulation(active);
        }
      } catch (e) {}
    }
  }, []);

  // Save Cart
  useEffect(() => {
    localStorage.setItem("deliveryCart", JSON.stringify(cart));
  }, [cart]);

  // Save Addresses
  useEffect(() => {
    localStorage.setItem("deliveryAddresses", JSON.stringify(deliveryAddresses));
  }, [deliveryAddresses]);

  // Derived calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);
  
  const deliveryFee = subtotal > 150 ? 0 : 20;
  const total = subtotal + deliveryFee;
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Categories & Search Filter
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
  }, [currentCategory, searchQuery, menuItems]);

  // Toast System
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  // Customization Logic
  const handleOpenCustomization = (item: MenuItem) => {
    setCustomizingItem(item);
    setCustomizationQuantity(1);
    setSelectedExtras([]);
    
    // Set default radio choices
    if (item.customization) {
      const spiceGroup = item.customization.find(g => g.title === "ระดับความเผ็ด");
      if (spiceGroup && spiceGroup.options.length > 0) {
        setSelectedSpiciness(spiceGroup.options[2]?.name || spiceGroup.options[0].name);
      }
      
      const meatGroup = item.customization.find(g => g.title === "เลือกความสุกของเนื้อ");
      if (meatGroup && meatGroup.options.length > 0) {
        setSelectedMeat(meatGroup.options[1]?.name || meatGroup.options[0].name);
        setSelectedMeatPrice(0);
      }
    }
  };

  const handleToggleExtra = (extraName: string, extraPrice: number) => {
    setSelectedExtras(prev => {
      const exists = prev.some(e => e.name === extraName);
      if (exists) {
        return prev.filter(e => e.name !== extraName);
      } else {
        return [...prev, { name: extraName, price: extraPrice }];
      }
    });
  };

  const currentCustomizationTotalPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const spicyPrice = customizingItem.name.includes("กะเพรา") && selectedSpiciness.includes("ตาแตก") ? 5 : 0;
    return (customizingItem.price + selectedMeatPrice + extrasTotal + spicyPrice) * customizationQuantity;
  }, [customizingItem, selectedSpiciness, selectedMeatPrice, selectedExtras, customizationQuantity]);

  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;
    
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const spicyPrice = customizingItem.name.includes("กะเพรา") && selectedSpiciness.includes("ตาแตก") ? 5 : 0;
    const unitPrice = customizingItem.price + selectedMeatPrice + extrasTotal + spicyPrice;

    const customizationDesc = {
      spiciness: selectedSpiciness || undefined,
      meat: selectedMeat || undefined,
      extras: selectedExtras,
    };

    // Create unique dynamic code/id based on customizations selected
    const extrasKey = selectedExtras.map(e => e.name).sort().join(",");
    const cartId = `${customizingItem.id}-${selectedSpiciness}-${selectedMeat}-${extrasKey}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + customizationQuantity }
            : item
        );
      }
      return [
        ...prev,
        {
          cartId,
          id: customizingItem.id,
          name: customizingItem.name,
          price: unitPrice,
          basePrice: customizingItem.price,
          image: customizingItem.image,
          quantity: customizationQuantity,
          customization: customizationDesc,
        },
      ];
    });

    setCustomizingItem(null);
    showToast(`เพิ่ม ${customizingItem.name} ลงตะกร้าแล้ว`);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => (item.cartId === cartId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  // Checkout Actions
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast("กรุณาเลือกอาหารก่อนทำการสั่งซื้อ");
      return;
    }
    setIsCheckoutOpen(true);
    setPromptPaySeconds(300); // 5 mins QR Code limit
    setIsQRConfirmed(false);
    setIsPaymentProcessing(false);
  };

  // PromptPay Countdown Timer
  useEffect(() => {
    if (isCheckoutOpen && paymentMethod === "qr" && !isQRConfirmed) {
      promptPayTimerRef.current = setInterval(() => {
        setPromptPaySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(promptPayTimerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (promptPayTimerRef.current) clearInterval(promptPayTimerRef.current);
    };
  }, [isCheckoutOpen, paymentMethod, isQRConfirmed]);

  const handleAddNewAddress = () => {
    if (!newAddressText.trim()) return;
    setDeliveryAddresses(prev => [...prev, newAddressText.trim()]);
    setSelectedAddressIndex(deliveryAddresses.length);
    setNewAddressText("");
    setIsAddingNewAddress(false);
    showToast("บันทึกที่อยู่จัดส่งใหม่แล้ว");
  };

  // Order Placement and Simulation Engine
  const handlePlaceOrder = () => {
    if (isPaymentProcessing) return;

    if (paymentMethod === "qr" && !isQRConfirmed) {
      // Simulate PromptPay scanning
      setIsPaymentProcessing(true);
      setTimeout(() => {
        setIsQRConfirmed(true);
        setIsPaymentProcessing(false);
        showToast("สแกนจ่ายสำเร็จ! กำลังส่งออเดอร์...");
      }, 1500);
      return;
    }

    // Cash or already QR paid: Place the order!
    const orderNum = Math.floor(100000 + Math.random() * 900000).toString();
    const newOrder: OrderRecord = {
      orderNumber: orderNum,
      shopName: currentRestaurant.name,
      items: [...cart],
      subtotal,
      total,
      address: deliveryAddresses[selectedAddressIndex],
      paymentMethod: paymentMethod === "qr" ? "QR PromptPay" : "เงินสดปลายทาง",
      date: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      status: "received",
    };

    // Update History in State and LocalStorage
    const updatedHistory = [newOrder, ...orderHistory.filter(o => o.status === "delivered")];
    setOrderHistory(updatedHistory);
    localStorage.setItem("deliveryHistory", JSON.stringify(updatedHistory));

    // Reset checkout states & empty cart
    setCart([]);
    setIsCheckoutOpen(false);
    setActiveOrder(newOrder);

    // Initial Chat setup with Rider
    setChatMessages([
      {
        sender: "rider",
        text: `สวัสดีครับพี่! ผมไรเดอร์ "สมชาย ยอดนักบิด" (รหัส #9942) ยินดีให้บริการครับ! ออเดอร์ของคุณส่งเข้าร้าน "${newOrder.shopName}" เรียบร้อยแล้ว กำลังรอร้านปรุงอาหารนะครับ เดี๋ยวมีความคืบหน้าอย่างไรผมจะทักไปบอกทันทีค้าบ! 🏍️`,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
    setSimulatedTimeRemaining(30);

    // Start Real-time/Accelerated Order Tracking Simulation
    setupOrderSimulation(newOrder);
  };

  const setupOrderSimulation = (order: OrderRecord) => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    const stages: OrderRecord["status"][] = ["received", "preparing", "delivering", "delivered"];
    let currentStageIndex = stages.indexOf(order.status);
    
    // Configurable speed: Accelerated (15 seconds per stage) or Real-time (minutes)
    const intervalTime = simulationSpeed === "accelerated" ? 15000 : 300000; // 15s vs 5mins

    simulationTimerRef.current = setInterval(() => {
      currentStageIndex += 1;
      if (currentStageIndex >= stages.length) {
        clearInterval(simulationTimerRef.current!);
        handleOrderCompleted();
        return;
      }

      const nextStatus = stages[currentStageIndex];
      setSimulatedTimeRemaining(prev => Math.max(0, prev - (simulationSpeed === "accelerated" ? 8 : 10)));

      // Trigger custom rider message based on next status
      const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      
      setActiveOrder(prev => {
        if (!prev) return null;
        const updated = { ...prev, status: nextStatus };

        // Save progress to LocalStorage
        setOrderHistory(history => {
          const updatedHistory = history.map(o => o.orderNumber === prev.orderNumber ? updated : o);
          localStorage.setItem("deliveryHistory", JSON.stringify(updatedHistory));
          return updatedHistory;
        });

        return updated;
      });

      // Rider automated notifications via Chat
      if (nextStatus === "preparing") {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "rider",
            text: "🍳 ทางร้านเริ่มปรุงเมนูสุดพิเศษของคุณแล้วครับ กลิ่นหอมฟุ้งลอยมาเลยครับผม!",
            time: timeStr,
          }
        ]);
      } else if (nextStatus === "delivering") {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "rider",
            text: "🏍️ ไรเดอร์ได้รับอาหารร้อนๆ แล้วครับ! ห่อกล่องเก็บความร้อนไว้อย่างดี กำลังบิดมอเตอร์ไซค์สุดพลังไปส่งที่บ้านพี่นะครับ เจอกันในอีกไม่ช้าค้าบ!",
            time: timeStr,
          }
        ]);
      } else if (nextStatus === "delivered") {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "rider",
            text: "✅ ถึงหน้าบ้านพี่เรียบร้อยแล้วครับ! ผมนำกล่องอาหารวางไว้ที่โต๊ะหน้าบ้านให้ตามที่ตกลงเรียบร้อย ฝากรีวิว 5 ดาวเป็นกำลังใจให้สมชายด้วยนะค้าบ ทานให้อร่อยและระวังร้อนนะครับป๋ม! 🙏⭐",
            time: timeStr,
          }
        ]);
      }

    }, intervalTime);
  };

  // Handle Simulation Speed Change
  const handleToggleSimulationSpeed = () => {
    const newSpeed = simulationSpeed === "accelerated" ? "realtime" : "accelerated";
    setSimulationSpeed(newSpeed);
    showToast(`เปลี่ยนการจำลองสถานะเป็น: ${newSpeed === "accelerated" ? "แบบเร่งความเร็ว (15 วิ/ขั้นตอน)" : "เวลาจริง (20-30 นาที)"}`);
  };

  useEffect(() => {
    if (activeOrder) {
      setupOrderSimulation(activeOrder);
    }
  }, [simulationSpeed]);

  const handleOrderCompleted = () => {
    setActiveOrder(prev => {
      if (!prev) return null;
      const completedOrder = { ...prev, status: "delivered" as const };
      
      // Update history in state & storage
      setOrderHistory(history => {
        const updated = history.map(o => o.orderNumber === prev.orderNumber ? completedOrder : o);
        localStorage.setItem("deliveryHistory", JSON.stringify(updated));
        return updated;
      });

      return completedOrder;
    });
    setSimulatedTimeRemaining(0);
    showToast("🎉 ไรเดอร์สมชาย จัดส่งอาหารสำเร็จเรียบร้อยแล้ว!");
  };

  // Rider Live Chat Action
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

    setChatMessages(prev => [...prev, { sender: "user", text: userMsg, time: timeStr }]);
    setChatInput("");

    // Simulate Rider intelligent automatic response based on text content
    setTimeout(() => {
      let reply = "รับทราบครับผม! สมชายกำลังดำเนินการให้อย่างเต็มที่เลยครับป๋ม 🏎️";
      const lowerMsg = userMsg.toLowerCase();

      if (lowerMsg.includes("วาง") || lowerMsg.includes("โต๊ะ") || lowerMsg.includes("หน้าบ้าน") || lowerMsg.includes("รั้ว")) {
        reply = "ได้เลยครับพี่! เดี๋ยวผมแขวน/วางอาหารไว้ที่หน้าบ้านให้ครับ ปลอดภัยหายห่วง สะอาดสะอ้านแน่นวลครับป๋ม!";
      } else if (lowerMsg.includes("ขอบคุณ") || lowerMsg.includes("thx") || lowerMsg.includes("thanks")) {
        reply = "ยินดีรับใช้และเต็มใจบริการเป็นอย่างยิ่งเลยครับพี่! ทานอาหารให้อร่อยฟินสุดๆ นะครับ อย่าลืมให้คะแนน 5 ดาวน้องด้วยนะค้าบผม ⭐🏍️";
      } else if (lowerMsg.includes("เผ็ด") || lowerMsg.includes("ช้อน") || lowerMsg.includes("เครื่องปรุง")) {
        reply = "สมชายทำการตรวจสอบกับทางร้านให้เรียบร้อยแล้วครับ มั่นใจได้เลยว่าได้ครบและตรงตามที่สั่งไว้ร้อยเปอร์เซ็นต์ครับพี่!";
      } else if (lowerMsg.includes("ช้า") || lowerMsg.includes("ไหน") || lowerMsg.includes("ถึงยัง")) {
        reply = "ตอนนี้รถแอบติดนิดหน่อยครับพี่ แต่สมชายกำลังลัดเลาะเข้าเส้นทางลัดด่วนพิเศษ บิดเต็มเกียร์เร่งส่งให้อย่างเร็วที่สุดเลยครับ!";
      }

      setChatMessages(prev => [...prev, { sender: "rider", text: reply, time: timeStr }]);
    }, 1500);
  };

  // Scroll to bottom of chat automatically
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  // Clean active timers on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      if (promptPayTimerRef.current) clearInterval(promptPayTimerRef.current);
    };
  }, []);

  return (
    <div className="text-gray-800 font-sans min-h-screen flex flex-col bg-[#f9fafb]">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Link back to shop selection */}
            <Link to="/shop" className="flex items-center cursor-pointer hover:opacity-90 transition">
              <i className="fas fa-chevron-left text-gray-500 mr-3 text-lg"></i>
              <i className="fas fa-utensils text-primary text-2xl mr-2"></i>
              <span className="font-bold text-xl text-dark">
                อาตี๋น้อย <span className="text-primary">{currentRestaurant.name}</span>
              </span>
            </Link>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาเมนูของร้านนี้..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-sm bg-gray-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <i className="fas fa-search text-sm"></i>
                </div>
              </div>
            </div>

            {/* Cart & Active Tracking Button */}
            <div className="flex items-center space-x-3">
              {activeOrder && (
                <button
                  onClick={() => {
                    // Quick scroll/view to Active Order tracking section
                    document.getElementById("tracking-section")?.scrollIntoView({ behavior: "smooth" });
                    showToast("เลื่อนลงไปด้านล่างเพื่อดูการจัดส่งแบบสดๆ");
                  }}
                  className="bg-green-100 text-green-700 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm border border-green-200 animate-pulse"
                >
                  <i className="fas fa-motorcycle mr-1.5"></i>
                  {activeOrder.status === "delivered" ? "จัดส่งสำเร็จแล้ว" : "กำลังจัดส่งออเดอร์..."}
                </button>
              )}
              
              <button 
                onClick={handleOpenCheckout}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full font-bold text-sm shadow-md transition flex items-center space-x-2"
              >
                <i className="fas fa-shopping-basket"></i>
                <span>สั่งซื้อเลย ({cartCount})</span>
              </button>

            </div>
          </div>
        </div>
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3 border-t border-gray-50 pt-2 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาเมนูในร้าน..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-sm bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <i className="fas fa-search text-xs"></i>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-dark overflow-hidden h-56 md:h-72">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={currentRestaurant.image}
          alt={currentRestaurant.name}
        />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-6 md:pb-10">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-primary text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                {currentRestaurant.popular ? "ยอดฮิต" : "คุณภาพเยี่ยม"}
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                <i className="fas fa-star text-yellow-400 mr-1"></i> {currentRestaurant.rating}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black">{currentRestaurant.name}</h1>
            <p className="text-gray-300 text-sm md:text-base mt-2 flex items-center space-x-4">
              <span><i className="fas fa-motorcycle text-primary mr-1"></i> ส่งฟรีเมื่อสั่งเกิน ฿150</span>
              <span>•</span>
              <span><i className="far fa-clock mr-1"></i> {currentRestaurant.deliveryTime}</span>
              <span>•</span>
              <span><i className="fas fa-map-marker-alt text-red-400 mr-1"></i> {currentRestaurant.distance}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Categories & Menu list (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Live Tracking Dashboard if available */}
          {activeOrder && (
            <div id="tracking-section" className="bg-white rounded-2xl p-6 shadow-md border border-green-100 space-y-6 transition-all duration-300">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h2 className="text-xl font-bold text-dark">ติดตามการส่งสดใหม่ของคุณ</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    หมายเลขคำสั่งซื้อ: <span className="font-mono font-bold text-gray-700">#{activeOrder.orderNumber}</span> | สั่งจากร้าน: {activeOrder.shopName}
                  </p>
                </div>
                
                {/* Simulation Control Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleSimulationSpeed}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition border ${
                      simulationSpeed === "accelerated"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <i className="fas fa-forward mr-1"></i> 
                    {simulationSpeed === "accelerated" ? "โหมดเร่งความเร็ว (เปิดอยู่)" : "โหมดเวลาจริง"}
                  </button>
                  {activeOrder.status === "delivered" && (
                    <button
                      onClick={() => {
                        setActiveOrder(null);
                        showToast("เคลียร์ออเดอร์แล้ว สั่งใหม่ได้เลย!");
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold transition"
                    >
                      ปิดการติดตาม
                    </button>
                  )}
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="grid grid-cols-4 relative py-2">
                {/* Line Background */}
                <div className="absolute top-6 left-[12%] right-[12%] h-1 bg-gray-200 -z-10 rounded"></div>
                {/* Animated Line Progress */}
                <div
                  className="absolute top-6 left-[12%] h-1 bg-green-500 -z-10 rounded transition-all duration-1000"
                  style={{
                    width:
                      activeOrder.status === "received" ? "0%" :
                      activeOrder.status === "preparing" ? "38%" :
                      activeOrder.status === "delivering" ? "76%" : "100%"
                  }}
                ></div>

                {/* Step 1: Received */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    activeOrder.status === "received" || activeOrder.status === "preparing" || activeOrder.status === "delivering" || activeOrder.status === "delivered"
                      ? "bg-green-500 text-white border-green-500 shadow-md shadow-green-100"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                    <i className="fas fa-receipt text-sm"></i>
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    activeOrder.status === "received" ? "text-green-600" : "text-gray-500"
                  }`}>รับออเดอร์แล้ว</span>
                </div>

                {/* Step 2: Preparing */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    activeOrder.status === "preparing" || activeOrder.status === "delivering" || activeOrder.status === "delivered"
                      ? "bg-green-500 text-white border-green-500 shadow-md"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                    <i className="fas fa-fire-burner text-sm"></i>
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    activeOrder.status === "preparing" ? "text-green-600" : "text-gray-500"
                  }`}>กำลังปรุงอาหาร</span>
                </div>

                {/* Step 3: Delivering */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    activeOrder.status === "delivering" || activeOrder.status === "delivered"
                      ? "bg-green-500 text-white border-green-500 shadow-md"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                    <i className="fas fa-motorcycle text-sm"></i>
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    activeOrder.status === "delivering" ? "text-green-600" : "text-gray-500"
                  }`}>กำลังจัดส่ง</span>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    activeOrder.status === "delivered"
                      ? "bg-green-500 text-white border-green-500 shadow-md"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}>
                    <i className="fas fa-house-chimney-check text-sm"></i>
                  </div>
                  <span className={`text-xs font-bold mt-2 ${
                    activeOrder.status === "delivered" ? "text-green-600" : "text-gray-500"
                  }`}>ส่งสำเร็จเรียบร้อย</span>
                </div>
              </div>

              {/* Rider Details and Simulated Live Visual Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                {/* Rider Card */}
                <div className="flex flex-col justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow float-rider"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                        alt="Rider Avatar"
                      />
                      <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div>
                      <h4 className="font-bold text-dark text-base">สมชาย ยอดนักบิด</h4>
                      <p className="text-xs text-primary font-bold"><i className="fas fa-shield-halved mr-1"></i> พนักงานดีเด่นระดับ 5 ดาว</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">จักรยานยนต์: ฮอนด้า เวฟ (กข-1234 กทม.)</p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => alert("กำลังต่อสายหาไรเดอร์สมชาย (จำลองการโทร)...")}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
                    >
                      <i className="fas fa-phone-alt text-gray-400 text-sm"></i>
                      <span>โทรหาไรเดอร์</span>
                    </button>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
                    >
                      <i className="fas fa-comment-dots text-white text-sm"></i>
                      <span>แชทถามไรเดอร์</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Live Visual Map */}
                <div className="relative h-32 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#d1fae5_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>
                  
                  {/* Dashed pathway */}
                  <div className="w-4/5 border-t-2 border-dashed border-emerald-300 relative flex justify-between px-2">
                    {/* Restaurant marker */}
                    <div className="absolute -top-3 left-4 flex flex-col items-center">
                      <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow">
                        <i className="fas fa-store"></i>
                      </span>
                      <span className="text-[9px] text-gray-600 font-bold mt-1">ร้านค้า</span>
                    </div>

                    {/* House destination */}
                    <div className="absolute -top-3 right-4 flex flex-col items-center">
                      <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow">
                        <i className="fas fa-home"></i>
                      </span>
                      <span className="text-[9px] text-gray-600 font-bold mt-1">บ้านผู้รับ</span>
                    </div>

                    {/* Sliding Rider Icon */}
                    <div
                      className="absolute -top-4 text-amber-500 text-xl drop-shadow transition-all duration-1000 flex flex-col items-center"
                      style={{
                        left:
                          activeOrder.status === "received" ? "12%" :
                          activeOrder.status === "preparing" ? "35%" :
                          activeOrder.status === "delivering" ? "65%" : "82%",
                        transform: "translateX(-50%)"
                      }}
                    >
                      <i className="fas fa-motorcycle text-2xl animate-bounce"></i>
                      <span className="bg-amber-100 text-amber-800 text-[8px] px-1 rounded-full font-extrabold shadow-sm border border-amber-200 -mt-1">
                        {activeOrder.status === "received" ? "รออาหาร" :
                         activeOrder.status === "preparing" ? "กำลังปรุง" :
                         activeOrder.status === "delivering" ? "แว้นด่วน" : "ถึงแล้ว!"}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-2 text-center text-[10px] text-gray-500 font-medium">
                    {activeOrder.status === "delivered" ? (
                      <span className="text-green-600 font-bold"><i className="fas fa-circle-check mr-1 animate-pulse"></i> นำส่งเรียบร้อยแล้ว ทานให้อร่อยครับ!</span>
                    ) : (
                      <span>ประมาณการส่งถึงปลายทางอีกประมาณ <strong className="text-primary">{simulatedTimeRemaining} นาที</strong></span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Categories Tab selector */}
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4 border-l-4 border-primary pl-3">เมนูแนะนำของร้าน</h2>
            <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full border text-xs font-bold transition shadow-sm ${
                    cat.id === currentCategory
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                  }`}
                  onClick={() => {
                    setCurrentCategory(cat.id);
                    setSearchQuery("");
                  }}
                >
                  <i className={`fas ${cat.icon} mr-1.5`}></i>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout of Items */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl py-20 text-center border border-gray-100">
              <i className="fas fa-search text-5xl text-gray-200 mb-4"></i>
              <h3 className="text-lg text-gray-600 font-bold">ไม่พบรายการเมนูที่ค้นหา</h3>
              <button
                onClick={() => setCurrentCategory("all")}
                className="mt-4 px-6 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition"
              >
                ดูเมนูทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="food-card bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    {item.popular && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-md uppercase tracking-wider">
                        <i className="fas fa-fire mr-1 animate-pulse"></i> ยอดนิยม
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-0.5 rounded flex items-center">
                      <i className="fas fa-star text-yellow-400 mr-1"></i> {item.rating}
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-gray-800 leading-snug line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">คัดเลือกวัตถุดิบคุณภาพสดใหม่ ปรุงร้อนกล่องต่อกล่อง</p>
                    </div>

                    <div className="flex justify-between items-center mt-5">
                      <span className="font-black text-lg text-primary">฿{item.price}</span>
                      
                      <button
                        onClick={() => {
                          if (item.customization) {
                            handleOpenCustomization(item);
                          } else {
                            // If no customization, add directly
                            setCart((prev) => {
                              const existing = prev.find((i) => i.id === item.id && !i.customization);
                              if (existing) {
                                return prev.map((i) => (i.id === item.id && !i.customization ? { ...i, quantity: i.quantity + 1 } : i));
                              }
                              return [...prev, { cartId: `${item.id}`, id: item.id, name: item.name, price: item.price, basePrice: item.price, image: item.image, quantity: 1 }];
                            });
                            showToast(`เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
                          }
                        }}
                        className="bg-gray-50 text-primary border border-gray-100 hover:bg-primary hover:text-white transition w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                      >
                        <i className="fas fa-plus text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Desktop shopping cart panel / Summary (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col">
            <h3 className="text-lg font-black border-b pb-4 mb-4 text-dark flex items-center">
              <i className="fas fa-shopping-cart text-primary mr-2"></i> สรุปตะกร้าสินค้าของคุณ
            </h3>

            {/* Cart list inside side-panel */}
            <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <i className="fas fa-basket-shopping text-4xl text-gray-200"></i>
                  <p className="text-xs font-bold">ตะกร้าของคุณว่างเปล่า</p>
                  <p className="text-[10px] text-gray-400">เลือกอาหารจานเด่นของตี๋น้อยใส่ตะกร้าได้เลยครับ!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex space-x-3 flex-1 min-w-0">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                        {item.customization && (
                          <div className="text-[10px] text-gray-400 mt-0.5 space-y-0.5">
                            {item.customization.spiciness && <span>• {item.customization.spiciness}</span>}
                            {item.customization.meat && <span> • {item.customization.meat}</span>}
                            {item.customization.extras.length > 0 && (
                              <p className="line-clamp-1">• ท็อปปิ้ง: {item.customization.extras.map(e => e.name).join(", ")}</p>
                            )}
                          </div>
                        )}
                        <span className="text-xs text-primary font-extrabold mt-1 inline-block">฿{item.price}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-2">
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-gray-300 hover:text-red-500 transition text-xs"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-150 transition"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-[11px] font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-150 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="border-t pt-4 mt-4 space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>ค่าอาหารทั้งหมด</span>
                <span className="font-bold text-gray-800">฿{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าส่งอาหาร</span>
                <span className={`font-bold ${deliveryFee === 0 ? "text-green-600" : "text-gray-800"}`}>
                  {deliveryFee === 0 ? "ฟรีจัดส่ง" : `฿${deliveryFee}`}
                </span>
              </div>
              {subtotal > 0 && subtotal < 150 && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 text-center font-medium">
                  <i className="fas fa-circle-info mr-1"></i> สั่งอีกเพียง <strong>฿{150 - subtotal}</strong> เพื่อรับสิทธิ์ส่งฟรี!
                </p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-800 border-t pt-3 mt-1">
                <span className="font-bold">รวมยอดสุทธิ</span>
                <span className="text-xl font-black text-primary">฿{total}</span>
              </div>

              <button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-2 mt-4 text-xs tracking-wider uppercase ${
                  cart.length === 0
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : "bg-primary hover:bg-primary-hover cursor-pointer"
                }`}
              >
                <span>ดำเนินการชำระเงิน</span>
                <i className="fas fa-arrow-right text-xs"></i>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="bg-dark text-white pt-12 pb-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-gray-800 pb-8 text-sm">
            <div>
              <div className="flex items-center mb-4">
                <i className="fas fa-utensils text-primary text-2xl mr-2"></i>
                <span className="font-bold text-xl">อาตี๋น้อย <span className="text-primary">Delivery</span></span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                แอปจำลองบริการจัดส่งอาหารออนไลน์ที่สมจริงที่สุด สะดวก รวดเร็ว สะอาด ปลอดภัย ด้วยเมนูเด็ดรสตาแตกจากเชฟชื่อดังและพนักงานบิดสุดเทพ
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary text-base">ระบบจำลองการทำงาน</h4>
              <ul className="text-gray-400 text-xs space-y-2">
                <li><i className="fas fa-check-circle text-green-500 mr-2"></i> แยกเมนูอาหารตามร้านค้าจริง</li>
                <li><i className="fas fa-check-circle text-green-500 mr-2"></i> เมนูสามารถเลือกท็อปปิ้งเสริมได้จริง</li>
                <li><i className="fas fa-check-circle text-green-500 mr-2"></i> จำลองการจ่ายเงินด้วย QR Code PromptPay</li>
                <li><i className="fas fa-check-circle text-green-500 mr-2"></i> ระบบจำลองติดตามสถานะไรเดอร์สดพร้อมแชทอัจฉริยะ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary text-base">เทคโนโลยีและดีไซน์</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                สร้างด้วย React, Tailwind CSS 4, HTML5 Semantic Tags, LocalStorage Persistence และ CSS dynamic keyframe animations
              </p>
            </div>
          </div>
          <div className="text-center text-gray-500 text-xs">
            &copy; 2026 อาตี๋น้อย Delivery. สงวนลิขสิทธิ์ความอร่อย.
          </div>
        </div>
      </footer>

      {/* -------------------- DYNAMIC MODALS & LAYERS -------------------- */}

      {/* 1. FOOD CUSTOMIZATION MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header / Picture */}
            <div className="relative h-48 w-full overflow-hidden">
              <img src={customizingItem.image} alt={customizingItem.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setCustomizingItem(null)}
                className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/75 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Customization Details Scroll */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-800">{customizingItem.name}</h3>
                <p className="text-xs text-gray-400 mt-1">ราคาเริ่มต้นเพียง ฿{customizingItem.price} เลือกท็อปปิ้งตามสไตล์คุณได้ที่นี่</p>
              </div>

              {customizingItem.customization && customizingItem.customization.map((group, groupIdx) => (
                <div key={groupIdx} className="border-t pt-4 first:border-0 first:pt-0">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-gray-800">{group.title}</h4>
                    {group.required ? (
                      <span className="text-[10px] bg-red-50 text-red-500 font-extrabold px-2 py-0.5 rounded">จำเป็นต้องเลือก</span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">เลือกได้ตามชอบ</span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    {group.type === "radio" ? (
                      group.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`group-${groupIdx}`}
                              checked={group.title === "ระดับความเผ็ด" ? selectedSpiciness === opt.name : selectedMeat === opt.name}
                              onChange={() => {
                                if (group.title === "ระดับความเผ็ด") {
                                  setSelectedSpiciness(opt.name);
                                } else {
                                  setSelectedMeat(opt.name);
                                  setSelectedMeatPrice(opt.price);
                                }
                              }}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <span className="font-medium text-gray-700">{opt.name}</span>
                          </div>
                          {opt.price > 0 && <span className="font-bold text-primary">+฿{opt.price}</span>}
                        </label>
                      ))
                    ) : (
                      group.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedExtras.some(e => e.name === opt.name)}
                              onChange={() => handleToggleExtra(opt.name, opt.price)}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <span className="font-medium text-gray-700">{opt.name}</span>
                          </div>
                          {opt.price > 0 && <span className="font-bold text-primary">+฿{opt.price}</span>}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Controls */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              {/* Quantity selector */}
              <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setCustomizationQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-800">{customizationQuantity}</span>
                <button
                  onClick={() => setCustomizationQuantity(prev => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button showing actual live dynamic price */}
              <button
                onClick={handleAddCustomizedToCart}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-wider py-3.5 px-8 rounded-xl shadow-md transition flex items-center space-x-2"
              >
                <i className="fas fa-cart-plus"></i>
                <span>เพิ่มลงตะกร้า (฿{currentCustomizationTotalPrice})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADVANCED INTERACTIVE CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-black text-dark flex items-center">
                <i className="fas fa-shopping-basket text-primary mr-2"></i> ดำเนินการสั่งซื้อออเดอร์
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              
              {/* Step 1: Summary Items */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-dark flex items-center">
                  <i className="fas fa-list-check text-primary mr-2"></i> สรุปเมนูอาหารที่สั่ง
                </h4>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex justify-between text-gray-700">
                      <span>
                        {item.name} <strong className="text-primary font-bold">x{item.quantity}</strong>
                        {item.customization && (
                          <span className="text-[10px] text-gray-400 block ml-2">
                            ({item.customization.spiciness && `${item.customization.spiciness}`}
                             {item.customization.meat && `, ${item.customization.meat}`}
                             {item.customization.extras.length > 0 && `, เพิ่ม: ${item.customization.extras.map(e => e.name).join(", ")}`})
                          </span>
                        )}
                      </span>
                      <span className="font-bold">฿{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2.5 mt-2 flex justify-between text-sm font-bold text-dark">
                    <span>ยอดสุทธิทั้งหมด (รวมค่าส่ง):</span>
                    <span className="text-base text-primary font-black">฿{total}</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Address Selection */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-dark flex justify-between items-center">
                  <span className="flex items-center"><i className="fas fa-map-location-dot text-primary mr-2"></i> ที่อยู่จัดส่งอาหาร</span>
                  {!isAddingNewAddress && (
                    <button
                      onClick={() => setIsAddingNewAddress(true)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      + เพิ่มที่อยู่ใหม่
                    </button>
                  )}
                </h4>

                {/* Add new address inline input */}
                {isAddingNewAddress ? (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                    <input
                      type="text"
                      placeholder="ระบุที่อยู่จัดส่งของคุณอย่างละเอียด..."
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary text-gray-800"
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                    />
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => setIsAddingNewAddress(false)}
                        className="px-3 py-1.5 bg-white text-gray-500 text-xs font-semibold rounded-lg border hover:bg-gray-100 transition"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleAddNewAddress}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-sm transition"
                      >
                        บันทึกที่อยู่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {deliveryAddresses.map((addr, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          selectedAddressIndex === idx
                            ? "bg-red-50/40 border-primary shadow-sm"
                            : "bg-white border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-addr"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="mt-0.5 w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="font-medium text-gray-700">{addr}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method selection */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-sm text-dark flex items-center">
                  <i className="fas fa-credit-card text-primary mr-2"></i> เลือกช่องทางชำระเงิน
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* QR PromptPay Option */}
                  <label
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "qr"
                        ? "bg-red-50/40 border-primary text-primary shadow-sm"
                        : "bg-white border-gray-150 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === "qr"}
                      onChange={() => setPaymentMethod("qr")}
                      className="sr-only"
                    />
                    <i className="fas fa-qrcode text-2xl mb-2"></i>
                    <span className="font-bold">QR PromptPay</span>
                    <span className="text-[10px] text-gray-400 mt-1">สแกนจ่ายสะดวกรวดเร็ว</span>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-red-50/40 border-primary text-primary shadow-sm"
                        : "bg-white border-gray-150 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="sr-only"
                    />
                    <i className="fas fa-wallet text-2xl mb-2"></i>
                    <span className="font-bold">เงินสดปลายทาง</span>
                    <span className="text-[10px] text-gray-400 mt-1">ชำระสดตอนรับอาหาร</span>
                  </label>
                </div>

                {/* Display QR Simulation Screen if PromptPay is selected */}
                {paymentMethod === "qr" && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col items-center space-y-4 relative overflow-hidden transition-all duration-300">
                    
                    {/* Pulsing promptpay header band */}
                    <div className="bg-[#002f5f] text-white w-full py-2.5 px-4 rounded-xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-white text-[#002f5f] px-1 rounded text-[8px] font-black italic tracking-tighter">
                          TH
                        </span>
                        <span className="font-black italic text-xs tracking-tight">PromptPay</span>
                      </div>
                      <span className="text-[9px] bg-sky-600 px-2 py-0.5 rounded font-bold animate-pulse">
                        พร้อมเพย์จำลอง
                      </span>
                    </div>

                    {/* QR Code Container with Animation Sweeping Laser Line */}
                    <div className="relative bg-white p-4 rounded-xl border shadow-sm w-44 h-44 flex items-center justify-center">
                      {/* Laser swept animation */}
                      {!isQRConfirmed && <div className="qr-laser"></div>}
                      
                      {isQRConfirmed ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                          <i className="fas fa-circle-check text-4xl text-green-500 animate-bounce"></i>
                          <span className="text-xs font-bold text-green-600">ชำระเงินสำเร็จ</span>
                        </div>
                      ) : (
                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                          {/* Beautiful simulated vector QR style pattern */}
                          <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                          <rect x="2" y="2" width="21" height="21" fill="white" />
                          <rect x="6" y="6" width="13" height="13" fill="currentColor" />

                          <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                          <rect x="77" y="2" width="21" height="21" fill="white" />
                          <rect x="81" y="6" width="13" height="13" fill="currentColor" />

                          <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                          <rect x="2" y="77" width="21" height="21" fill="white" />
                          <rect x="81" y="81" width="13" height="13" fill="currentColor" />

                          <path d="M 35,5 h 5 v 10 h -5 z" fill="currentColor" />
                          <path d="M 45,10 h 10 v 5 h -10 z" fill="currentColor" />
                          <path d="M 60,5 h 10 v 15 h -10 z" fill="currentColor" />
                          <path d="M 35,25 h 15 v 5 h -15 z" fill="currentColor" />
                          <path d="M 55,25 h 10 v 10 h -10 z" fill="currentColor" />
                          <path d="M 10,35 h 15 v 10 h -15 z" fill="currentColor" />
                          <path d="M 30,40 h 20 v 5 h -20 z" fill="currentColor" />
                          <path d="M 55,45 h 15 v 5 h -15 z" fill="currentColor" />
                          <path d="M 15,55 h 10 v 15 h -10 z" fill="currentColor" />
                          <path d="M 35,60 h 25 v 5 h -25 z" fill="currentColor" />
                          <path d="M 40,75 h 15 v 15 h -15 z" fill="currentColor" />
                          <path d="M 65,75 h 10 v 25 h -10 z" fill="currentColor" />
                          <circle cx="50" cy="50" r="10" fill="#002f5f" />
                          <circle cx="50" cy="50" r="8" fill="white" />
                          <circle cx="50" cy="50" r="4" fill="#dc2626" />
                        </svg>
                      )}
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 block uppercase tracking-wider">จำนวนยอดโอนเงิน</span>
                      <strong className="text-2xl font-black text-gray-800">฿{total.toFixed(2)}</strong>
                    </div>

                    <div className="text-[10px] text-gray-500 font-medium text-center">
                      {isQRConfirmed ? (
                        <span className="text-green-600 font-bold"><i className="fas fa-shield mr-1"></i> ได้รับความคุ้มครองระบบรักษาความปลอดภัยแล้ว</span>
                      ) : (
                        <span>คิวอาร์โค้ดหมดอายุใน: <strong className="text-primary font-mono">{Math.floor(promptPaySeconds / 60)}:{(promptPaySeconds % 60).toString().padStart(2, "0")} นาที</strong></span>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-6 py-3.5 bg-white border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
              >
                ยกเลิก
              </button>

              <button
                onClick={handlePlaceOrder}
                disabled={isPaymentProcessing || (paymentMethod === "qr" && isQRConfirmed)}
                className={`py-3.5 px-8 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 text-white bg-primary hover:bg-primary-hover ${
                  isPaymentProcessing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isPaymentProcessing ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    <span>กำลังประมวลผลจ่าย...</span>
                  </>
                ) : paymentMethod === "qr" && !isQRConfirmed ? (
                  <>
                    <i className="fas fa-qrcode"></i>
                    <span>สแกนชำระเงิน (จำลอง)</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    <span>ส่งออเดอร์ทันที (฿{total})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIMULATED RIDER LIVE CHAT POPUP WIDGET */}
      {isChatOpen && activeOrder && (
        <div className="fixed bottom-5 right-5 w-[90vw] sm:w-[380px] h-[450px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-gray-150 overflow-hidden chat-bubble">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                  alt="Rider Portrait"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-primary"></span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">สมชาย ยอดนักบิด</h4>
                <p className="text-[10px] text-red-100 flex items-center">
                  <span className="flex h-1.5 w-1.5 relative mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                  </span>
                  ไรเดอร์กำลังสแตนด์บายให้บริการ
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-red-100 transition p-1.5 hover:bg-black/10 rounded-full"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfdfd] text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl shadow-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-150"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1 font-mono">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {/* Send Input Bar */}
          <div className="p-3 border-t bg-gray-50 flex items-center space-x-2">
            <input
              type="text"
              placeholder="พิมพ์คำถาม หรือข้อความหาไรเดอร์..."
              className="flex-1 p-2.5 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:border-primary text-gray-800"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary-hover text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md transition"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
        </div>
      )}

      {/* 4. TOAST NOTIFICATION CONTAINER */}
      <div
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center transition-all duration-300 ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <i className="fas fa-check-circle text-green-400 mr-2 text-base"></i>
        <span className="text-xs font-bold font-sans">{toastMessage}</span>
      </div>

    </div>
  );
}
