"use client";

import { useState, useMemo } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// defaultItems: [{ sanpham_id, soluong, dongia, tensanpham, danhmuc_id, tendanhmuc }]
export default function ProductPicker({ categories = [], products = [], defaultItems = [] }) {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(() =>
    defaultItems.map((i) => ({
      product: {
        id: i.sanpham_id,
        tensanpham: i.tensanpham || "Sản phẩm đã xóa",
        gia: i.dongia,
        soluong: i.soluong + 99, // cho phép chỉnh SL khi edit
        danhmuc_id: i.danhmuc_id,
        tendanhmuc: i.tendanhmuc || "",
      },
      qty: i.soluong,
    }))
  );

  const visible = useMemo(
    () => (tab === "all" ? products : products.filter((p) => String(p.danhmuc_id) === tab)),
    [tab, products]
  );

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.product.gia) * i.qty, 0),
    [items]
  );

  const add = (product) =>
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found)
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, qty: Math.min(i.qty + 1, product.soluong) }
            : i
        );
      return [...prev, { product, qty: 1 }];
    });

  const setQty = (id, val) => {
    const n = parseInt(val, 10);
    if (!n || n < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === id ? { ...i, qty: Math.min(n, i.product.soluong) } : i
      )
    );
  };

  const remove = (id) => setItems((prev) => prev.filter((i) => i.product.id !== id));

  return (
    <div className="pp-wrap">
      {/* hidden inputs để Server Action đọc */}
      <input type="hidden" name="tongtien" value={total} readOnly />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((i) => ({
            sanpham_id: i.product.id,
            soluong: i.qty,
            dongia: i.product.gia,
          }))
        )}
        readOnly
      />

      {/* Tabs danh mục */}
      <div className="pp-tabs">
        {[{ id: "all", tendanhmuc: "Tất cả" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pp-tab${tab === String(c.id) ? " active" : ""}`}
            onClick={() => setTab(String(c.id))}
          >
            {c.tendanhmuc}
          </button>
        ))}
      </div>

      {/* Grid sản phẩm */}
      <div className="pp-grid">
        {visible.length === 0 && (
          <p className="pp-empty">Không có sản phẩm nào.</p>
        )}
        {visible.map((p) => {
          const inCart = items.find((i) => i.product.id === p.id);
          const oos = p.soluong === 0;
          return (
            <div
              key={p.id}
              className={`pp-card${inCart ? " pp-card--active" : ""}${oos ? " pp-card--oos" : ""}`}
            >
              <span className="pp-badge">{p.tendanhmuc}</span>
              <p className="pp-name">{p.tensanpham}</p>
              <p className="pp-price">{fmt(p.gia)}</p>
              <p className="pp-stock">Còn: {p.soluong}</p>
              <button
                type="button"
                className="pp-btn-add"
                onClick={() => add(p)}
                disabled={oos}
              >
                {oos ? "Hết hàng" : inCart ? "+ Thêm nữa" : "+ Thêm"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bảng giỏ hàng */}
      <div className="pp-cart">
        <p className="pp-cart-title">
          Sản phẩm trong đơn
          {items.length > 0 && <span className="pp-count">{items.length}</span>}
        </p>

        {items.length === 0 ? (
          <p className="pp-empty">Chưa có sản phẩm nào.</p>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>SL</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ product, qty }) => (
                <tr key={product.id}>
                  <td>
                    <span className="pp-tname">{product.tensanpham}</span>
                    {product.tendanhmuc && (
                      <span className="pp-tcat">{product.tendanhmuc}</span>
                    )}
                  </td>
                  <td>{fmt(product.gia)}</td>
                  <td>
                    <input
                      type="number"
                      className="pp-qty"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(product.id, e.target.value)}
                    />
                  </td>
                  <td className="pp-sub">{fmt(Number(product.gia) * qty)}</td>
                  <td>
                    <button
                      type="button"
                      className="pp-btn-rm"
                      onClick={() => remove(product.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pp-total-lbl">Tổng tiền</td>
                <td colSpan={2} className="pp-total-val">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <style>{`
        .pp-wrap { display:flex; flex-direction:column; gap:14px; }

        .pp-tabs { display:flex; flex-wrap:wrap; gap:6px; }
        .pp-tab {
          padding:4px 13px; border:1px solid #d1d5db; border-radius:999px;
          font-size:13px; background:#f3f4f6; color:#374151; cursor:pointer; transition:all .15s;
        }
        .pp-tab:hover { border-color:#3b82f6; color:#3b82f6; }
        .pp-tab.active { background:#3b82f6; border-color:#3b82f6; color:#fff; }

        .pp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; }
        .pp-card {
          border:1px solid #e5e7eb; border-radius:8px; padding:12px;
          display:flex; flex-direction:column; gap:5px; background:#fff; transition:all .15s;
        }
        .pp-card:hover { border-color:#93c5fd; box-shadow:0 2px 8px rgba(59,130,246,.1); }
        .pp-card--active { border-color:#3b82f6; background:#eff6ff; }
        .pp-card--oos { opacity:.5; }
        .pp-badge {
          font-size:11px; font-weight:500; color:#6366f1; background:#eef2ff;
          padding:2px 7px; border-radius:999px; align-self:flex-start;
        }
        .pp-name { font-size:13px; font-weight:600; color:#111827; margin:0; line-height:1.4; }
        .pp-price { font-size:13px; font-weight:700; color:#ef4444; margin:0; }
        .pp-stock { font-size:11px; color:#6b7280; margin:0; }
        .pp-btn-add {
          margin-top:4px; padding:5px 10px; background:#3b82f6; color:#fff;
          border:none; border-radius:6px; font-size:12px; font-weight:500;
          cursor:pointer; transition:background .15s;
        }
        .pp-btn-add:hover:not(:disabled) { background:#2563eb; }
        .pp-btn-add:disabled { background:#9ca3af; cursor:not-allowed; }
        .pp-empty { font-size:13px; color:#9ca3af; margin:0; }

        .pp-cart { border-top:1px solid #e5e7eb; padding-top:14px; }
        .pp-cart-title {
          font-size:13px; font-weight:600; color:#374151;
          margin:0 0 10px; display:flex; align-items:center; gap:7px;
        }
        .pp-count {
          background:#3b82f6; color:#fff; font-size:11px;
          font-weight:700; padding:1px 7px; border-radius:999px;
        }
        .pp-table { width:100%; border-collapse:collapse; font-size:13px; }
        .pp-table th {
          text-align:left; padding:6px 10px; font-size:11px; font-weight:600;
          color:#6b7280; border-bottom:1px solid #e5e7eb; text-transform:uppercase; letter-spacing:.04em;
        }
        .pp-table td { padding:8px 10px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
        .pp-tname { display:block; font-weight:500; color:#111827; }
        .pp-tcat  { display:block; font-size:11px; color:#9ca3af; margin-top:1px; }
        .pp-qty { width:54px; padding:4px 6px; border:1px solid #d1d5db; border-radius:5px; font-size:13px; text-align:center; }
        .pp-sub { font-weight:600; }
        .pp-btn-rm { background:none; border:none; color:#ef4444; cursor:pointer; padding:3px 7px; border-radius:4px; transition:background .1s; }
        .pp-btn-rm:hover { background:#fee2e2; }
        .pp-table tfoot td { padding:10px 10px; border-top:2px solid #e5e7eb; font-weight:700; }
        .pp-total-lbl { text-align:right; font-size:13px; color:#374151; }
        .pp-total-val { font-size:16px; color:#ef4444; }
      `}</style>
    </div>
  );
}
