# อาตี๋น้อย Food Delivery

เว็บสั่งอาหารและระบบหลังบ้านสำหรับจัดการร้าน เมนู ออเดอร์ ลูกค้า ไรเดอร์ และการชำระเงิน พัฒนาด้วย React 19, React Router 7, TypeScript, Vite และ Tailwind CSS

## ความสามารถหลัก

### ฝั่งลูกค้า

- ดูรายชื่อร้านอาหารและค้นหาร้าน
- ดูเมนูและตัวเลือกเพิ่มเติมของแต่ละร้าน
- เพิ่มสินค้า แก้ไขจำนวน และตรวจสอบตะกร้า
- ระบุข้อมูลจัดส่งและสร้างออเดอร์
- รองรับการเข้าสู่ระบบด้วยหมายเลขโทรศัพท์

### ฝั่งผู้ดูแลระบบ

- Dashboard สรุปยอดขาย ออเดอร์ ร้าน เมนู และลูกค้า
- จัดการหมวดหมู่ ร้านอาหาร เมนู ลูกค้า ที่อยู่ และไรเดอร์
- อัปเดตสถานะออเดอร์ สถานะชำระเงิน และมอบหมายไรเดอร์
- ตรวจสอบเมนู จำนวน ตัวเลือก หมายเหตุ และยอดรวมของแต่ละออเดอร์
- ตรวจสอบรายการชำระเงิน

## เทคโนโลยี

- React 19
- React Router 7
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- Font Awesome

## สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป
- npm
- Food API ที่รองรับ REST endpoints ของโปรเจกต์

## เริ่มต้นใช้งาน

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ environment จากไฟล์ตัวอย่าง:

```bash
copy .env.example .env
```

สำหรับ macOS หรือ Linux ใช้คำสั่ง:

```bash
cp .env.example .env
```

กำหนด URL ของ API ใน `.env`:

```env
VITE_FOOD_API_URL=http://localhost:3000/api
```

จากนั้นเปิด development server:

```bash
npm run dev
```

เว็บไซต์จะเปิดที่ [http://localhost:5173](http://localhost:5173)

> ตัวแปรที่ขึ้นต้นด้วย `VITE_` จะถูกรวมอยู่ใน client bundle จึงไม่ควรใช้เก็บรหัสผ่าน, API secret หรือ Admin key

## คำสั่งที่ใช้บ่อย

| คำสั่ง | รายละเอียด |
| --- | --- |
| `npm run dev` | เปิด development server พร้อม HMR |
| `npm run typecheck` | สร้าง route types และตรวจสอบ TypeScript |
| `npm run build` | สร้าง production build |
| `npm run start` | เปิด production server จากโฟลเดอร์ `build` |

## เส้นทางของเว็บไซต์

| Path | รายละเอียด |
| --- | --- |
| `/` | หน้าแรก |
| `/shop` | รายชื่อร้านอาหาร |
| `/shop/:id` | เมนูและหน้าสั่งอาหารของร้าน |
| `/admin` | เข้าสู่ระบบผู้ดูแล |
| `/admin/dashboard` | ภาพรวมระบบ |
| `/admin/orders` | จัดการออเดอร์และตรวจสอบเมนู |
| `/admin/categories` | จัดการหมวดหมู่ร้าน |
| `/admin/restaurants` | จัดการร้านอาหาร |
| `/admin/menu_items` | จัดการเมนูอาหาร |
| `/admin/customers` | จัดการลูกค้า |
| `/admin/addresses` | จัดการที่อยู่จัดส่ง |
| `/admin/riders` | จัดการไรเดอร์ |
| `/admin/payments` | ตรวจสอบการชำระเงิน |

## การเชื่อมต่อ API

Frontend จะนำ `VITE_FOOD_API_URL` ไปต่อกับ REST paths เช่น:

```text
POST /auth/user/login
POST /auth/admin/login
GET  /restaurants
GET  /restaurants/:id
GET  /menu-items
GET  /menu-items/:id
POST /customers
POST /addresses
GET  /orders
POST /orders
GET  /orders/:id
PATCH /orders/:id/status
PATCH /orders/:id/payment
PATCH /orders/:id/rider
```

หาก API อยู่คนละ origin ต้องตั้งค่า CORS ให้ยอมรับ origin ของ frontend เช่น `http://localhost:5173`

โปรเจกต์มีไฟล์ [Code.gs](./Code.gs) และ [API_EXAMPLES.md](./API_EXAMPLES.md) สำหรับตัวอย่าง Google Apps Script API แยกต่างหาก หากนำไปใช้จริงควรเพิ่ม authentication, authorization, rate limiting และการจัดการ secret ให้เหมาะสม

## การเข้าสู่ระบบ Admin

เปิด `/admin` แล้วกรอก Admin key ที่ backend กำหนดไว้ เมื่อเข้าสู่ระบบสำเร็จ access token และ Admin key จะถูกเก็บใน `sessionStorage` และถูกล้างเมื่อออกจากระบบหรือสิ้นสุด browser session

ไม่ควรใส่ Admin key ใน `.env` ของ frontend เพราะค่าจาก Vite สามารถอ่านได้จาก browser

## โครงสร้างโปรเจกต์

```text
food/
├── app/
│   ├── lib/                  # API clients และ authentication
│   ├── routes/
│   │   ├── Admin/            # Dashboard และหน้าจัดการข้อมูล
│   │   └── shop/             # หน้าร้านและหน้าสั่งอาหาร
│   ├── app.css               # Tailwind theme และ global styles
│   ├── root.tsx              # Root layout
│   └── routes.ts             # Route configuration
├── public/                   # Static assets
├── Code.gs                   # ตัวอย่าง Google Apps Script backend
├── API_EXAMPLES.md           # ตัวอย่างเรียก Google Apps Script API
├── Dockerfile
├── react-router.config.ts
├── vite.config.ts
└── package.json
```

## Production build

สร้างและเปิด production server:

```bash
npm run build
npm run start
```

ไฟล์ผลลัพธ์จะอยู่ใน `build/client` และ `build/server`

เนื่องจาก `VITE_FOOD_API_URL` เป็น build-time variable ต้องกำหนดค่าก่อนรัน `npm run build` ทุกครั้งที่ต้องการเปลี่ยน API endpoint

## Docker

สร้าง image:

```bash
docker build -t ateenoi-food .
```

เปิด container:

```bash
docker run --rm -p 3000:3000 ateenoi-food
```

จากนั้นเปิด [http://localhost:3000](http://localhost:3000)

หากต้องการใช้ API URL อื่นใน Docker ให้แก้ `VITE_FOOD_API_URL` ในไฟล์ `.env` ก่อนสั่ง `docker build` เนื่องจากค่านี้ถูกฝังใน frontend ระหว่างขั้นตอน build

## หมายเหตุด้านความปลอดภัย

- `.env` ถูก ignore โดย Git และไม่ควร commit
- ใช้ `.env.example` เป็นแม่แบบโดยไม่ใส่ secret จริง
- เก็บ secret และ signing keys ไว้ที่ backend เท่านั้น
- Production API ควรใช้ HTTPS และตรวจสอบสิทธิ์ทุก endpoint ฝั่ง Admin
