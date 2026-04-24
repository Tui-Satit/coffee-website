import "./App.css";
import { useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const LINE_LINK = "https://line.me/ti/p/~satitme";

const menuItems = [
  {
    id: 1,
    name: "Espresso",
    description: "กาแฟช็อตเข้มข้น กลมกล่อม",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=900&q=80",
    badge: "ยอดนิยม",
  },
  {
    id: 2,
    name: "Americano",
    description: "กาแฟดำ หอม เข้ม ไม่หวาน",
    price: 50,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Latte",
    description: "กาแฟนมนุ่ม หอมละมุน",
    price: 60,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Cappuccino",
    description: "กาแฟนมพร้อมฟองนมนุ่ม",
    price: 60,
    image:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=80",
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("รับที่ร้าน");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);

      if (found) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const createOrderText = () => {
    let text = "☕ ออเดอร์กาแฟใหม่\n";
    text += "--------------------\n";

    cart.forEach((item) => {
      text += `${item.name} x ${item.qty} = ${item.price * item.qty} บาท\n`;
    });

    text += "--------------------\n";
    text += `รวมทั้งหมด: ${totalPrice} บาท\n`;
    text += `รูปแบบการรับ: ${orderType}\n`;
    text += `ชื่อลูกค้า: ${customerName || "-"}\n`;

    if (note.trim()) {
      text += `หมายเหตุ: ${note}\n`;
    }

    return text;
  };

  const copyOrder = async () => {
    if (cart.length === 0) {
      alert("กรุณาเลือกเมนูก่อนคัดลอกออเดอร์");
      return;
    }

    try {
      await navigator.clipboard.writeText(createOrderText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("คัดลอกไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    if (!customerName.trim()) {
      alert("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
      return;
    }

    setSending(true);

    const orderData = {
      customerName,
      orderType,
      note,
      items: cart,
      totalPrice,
      status: "new",
      createdAt: serverTimestamp(),
    };

    try {
      await push(ref(db, "orders"), orderData);

      alert("ส่งออเดอร์เรียบร้อยแล้ว ร้านจะเห็นในหน้า Monitor");

      setCart([]);
      setCustomerName("");
      setOrderType("รับที่ร้าน");
      setNote("");
      setCopied(false);
    } catch {
      alert("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">☕</div>
          <strong>ร้านกาแฟมินิมอล</strong>
        </div>

        <nav className="nav">
          <span>หน้าแรก</span>
          <span>เมนูกาแฟ</span>
        </nav>

        <div className="cart-badge">🛒 {totalQty}</div>
      </header>

      <main className="page">
        <section className="menu-area">
          <div className="hero">
            <p className="eyebrow">Fresh coffee every day</p>
            <h1>กาแฟคุณตุ่ย ☕</h1>
            <p>เมนูชัดเจน สั่งง่าย รับที่ร้านได้ทันที</p>
          </div>

          <h2 className="section-title">☕ เมนูกาแฟยอดนิยม</h2>

          <div className="menu-grid">
            {menuItems.map((item) => (
              <article className="coffee-card" key={item.id}>
                <div className="coffee-image-wrap">
                  <img src={item.image} alt={item.name} />
                  {item.badge && <span className="badge">{item.badge}</span>}
                  <button className="heart-btn">♡</button>
                </div>

                <div className="coffee-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>

                  <div className="coffee-footer">
                    <strong>{item.price} บาท</strong>
                    <button onClick={() => addToCart(item)}>＋ เพิ่ม</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="order-card">
          <h2>🛍️ ออเดอร์ของคุณ</h2>

          <label>ชื่อลูกค้า</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="กรอกชื่อของคุณ"
          />

          <label>รูปแบบการรับ</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            <option value="รับที่ร้าน">รับที่ร้าน</option>
            <option value="จัดส่ง">จัดส่ง</option>
          </select>

          <div className="divider" />

          <h3>รายการสั่งซื้อ</h3>

          <div className="cart-list">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>☕</span>
                <strong>ยังไม่มีเมนูในออเดอร์</strong>
                <p>เลือกเมนูที่คุณชอบได้เลย</p>
              </div>
            ) : (
              cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.price} บาท</p>
                  </div>

                  <div className="qty">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>

          <label>หมายเหตุถึงร้าน</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น หวานน้อย ไม่ใส่น้ำตาล เพิ่มช็อต"
          />

          <div className="total-row">
            <span>รวมทั้งหมด</span>
            <strong>{totalPrice} บาท</strong>
          </div>

          {copied && <p className="copy-success">✅ คัดลอกออเดอร์แล้ว</p>}

          <button className="copy-btn" onClick={copyOrder}>
            📋 คัดลอกออเดอร์
          </button>

          <a
            className="line-btn"
            href={LINE_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 เปิด LINE (satitme)
          </a>

          <button className="submit-btn" onClick={submitOrder} disabled={sending}>
            {sending ? "กำลังส่งออเดอร์..." : "🚀 ส่งออเดอร์ให้ร้าน"}
          </button>
        </aside>
      </main>

      <footer className="features">
        <div>🌿 สดใหม่ทุกแก้ว</div>
        <div>❤️ รสชาติดี กลมกล่อม</div>
        <div>🏪 รับที่ร้าน สะดวก รวดเร็ว</div>
      </footer>
    </div>
  );
}

export default App;