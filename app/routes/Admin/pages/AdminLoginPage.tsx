import type { FormEvent } from "react";
import { Link } from "react-router";

type Props = {
  keyInput: string;
  loading: boolean;
  error: string;
  onKeyChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function AdminLoginPage({ keyInput, loading, error, onKeyChange, onSubmit }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-red-200">
          <i className="fas fa-shield-halved text-xl" />
        </div>
        <p className="text-sm font-bold text-primary">อาตี๋น้อย Delivery</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Admin Login</h1>
        <p className="mt-3 text-sm text-slate-500">กรอก Admin key สำหรับเข้าสู่ระบบผู้ดูแล</p>
        <form onSubmit={onSubmit} className="mt-8">
          <label htmlFor="admin-key" className="mb-2 block text-sm font-bold text-slate-700">Admin key</label>
          <input
            id="admin-key"
            type="password"
            value={keyInput}
            onChange={(event) => onKeyChange(event.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-red-100"
            autoFocus
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-white transition hover:bg-primary-hover disabled:opacity-60">
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบจัดการ"}
          </button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-slate-400 hover:text-primary">
          <i className="fas fa-arrow-left mr-2" /> กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
