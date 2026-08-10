import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { authApi } from "../lib/auth-api";
import { saveAccessToken } from "../lib/api-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "เข้าสู่ระบบ - อาตี๋น้อย Delivery" },
    {
      name: "description",
      content: "เข้าสู่ระบบอาตี๋น้อย Delivery ด้วยหมายเลขโทรศัพท์",
    },
  ];
}

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);

export default function Home() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);

    if (!/^0[689]\d{8}$/.test(normalizedPhone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลักให้ถูกต้อง");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await authApi.userLogin(normalizedPhone);
      const previousPhone = localStorage.getItem("foodApiGuestPhone");
      if (previousPhone && previousPhone !== normalizedPhone) {
        Object.keys(localStorage)
          .filter((key) => key.startsWith("foodApiAddress:"))
          .forEach((key) => localStorage.removeItem(key));
      }
      saveAccessToken("user", result.access_token);
      localStorage.setItem("foodApiCustomerId", result.user.customer_id);
      localStorage.setItem("foodApiGuestPhone", result.user.phone);
      localStorage.setItem("foodApiUser", JSON.stringify(result.user));
      navigate("/shop");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f5]">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2 lg:px-10">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-red-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
              <i className="fas fa-utensils text-lg" />
            </span>
            <span className="text-xl font-bold text-dark">
              อาตี๋น้อย <span className="text-primary">Delivery</span>
            </span>
          </div>

          <h1 className="max-w-lg text-5xl font-black leading-tight text-dark">
            ของอร่อยใกล้คุณ
            <span className="mt-2 block text-primary">พร้อมส่งถึงหน้าบ้าน</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-500">
            เข้าสู่ระบบด้วยเบอร์โทรศัพท์ แล้วเลือกสั่งอาหารจากร้านโปรดของคุณได้ทันที
          </p>

          <div className="mt-10 flex gap-8 text-sm text-gray-500">
            <div>
              <i className="fas fa-bolt mb-2 block text-xl text-primary" />
              <strong className="block text-dark">สั่งง่าย</strong>
              ไม่ต้องจำรหัสผ่าน
            </div>
            <div>
              <i className="fas fa-motorcycle mb-2 block text-xl text-primary" />
              <strong className="block text-dark">ส่งไว</strong>
              ติดตามได้ทุกขั้นตอน
            </div>
            <div>
              <i className="fas fa-shield-halved mb-2 block text-xl text-primary" />
              <strong className="block text-dark">ปลอดภัย</strong>
              ข้อมูลได้รับการดูแล
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] bg-white p-7 shadow-2xl shadow-red-100/60 ring-1 ring-gray-100 sm:p-10">
            <div className="mb-8 lg:hidden">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-red-200">
                <i className="fas fa-utensils text-xl" />
              </span>
              <p className="text-lg font-bold text-dark">
                อาตี๋น้อย <span className="text-primary">Delivery</span>
              </p>
            </div>

            <p className="text-sm font-semibold text-primary">ยินดีต้อนรับ</p>
            <h2 className="mt-2 text-3xl font-black text-dark">เข้าสู่ระบบ</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              กรอกเบอร์โทรศัพท์ของคุณเพื่อเริ่มสั่งอาหาร
            </p>

            <form className="mt-8" onSubmit={handleSubmit} noValidate>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                เบอร์โทรศัพท์
              </label>
              <div
                className={`flex items-center rounded-2xl border bg-gray-50 transition focus-within:bg-white focus-within:ring-4 ${
                  error
                    ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100"
                    : "border-gray-200 focus-within:border-primary focus-within:ring-red-100"
                }`}
              >
                <span className="border-r border-gray-200 px-4 py-4 text-sm font-bold text-gray-600">
                  +66
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  autoFocus
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={(event) => {
                    setPhone(normalizePhone(event.target.value));
                    if (error) setError("");
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "phone-error" : undefined}
                  className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base font-medium tracking-wide text-dark outline-none placeholder:text-gray-400"
                />
              </div>

              {error && (
                <p id="phone-error" className="mt-2 text-sm text-red-600" role="alert">
                  <i className="fas fa-circle-exclamation mr-1.5" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl active:translate-y-0"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-arrow-right"} text-sm`} />
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
              เมื่อเข้าสู่ระบบ ถือว่าคุณยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัว
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
