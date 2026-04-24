import "./App.css";
import { useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "./firebase"; // ✅ ใช้ db

const LINE_PERSONAL_ID = "satitme";
const LINE_LINK = `https://line.me/ti/p/~${LINE_PERSONAL_ID}`;

const menuItems = [
  { id: 1, name: "Espresso", description: "กาแฟช็อตเข้มข้น กลมกล่อม", price: 45, image: "/images/espresso.jpg" },
  { id: 2, name: "Americano", description: "กาแฟดำ หอม เข้ม ไม่หวาน", price: 50, image: "/images/americano.jpg" },
  { id: 3, name: "Latte", description: "กาแฟนมนุ่ม หอมละมุน", price: 60, image: "/images/latte.jpg" },
  { id: 4, name: "Cappuccino", description: "กาแฟนมพร้อมฟองนมนุ่ม", price: 60, image: "/images/cappuccino.jpg" },
];

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [orderType, setOrderType] = useState("รับที่ร้าน");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  // ➕ เพิ่มสินค้า
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

  // ➕➖ จำนวน
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

  // 💰 รวมราคา
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // 🧾 สร้างข้อความออเดอร์ (ไว้ Copy)
  const createOrderText = () => {
    let text = "☕ ออเดอร์กาแฟใหม่\n";
    text += "--------------------\n";

    cart.forEach((i) => {
      text += `${i.name} x ${i.qty} = ${i.price * i.qty} บาท\n`;
    });

    text += "--------------------\n";
    text += `รวมทั้งหมด: ${totalPrice} บาท\n`;
    text += `ประเภท: ${orderType}\n`;
    text += `ชื่อลูกค้า: ${customerName || "-"}\n`;

    if (note.trim()) {
      text += `หมายเหตุ: ${note}\n`;
    }

    return text;
  };

  // 📋 คัดลอกออเดอร์
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

  // 🚀 ส่งออเดอร์เข้า Firebase (ไปโผล่ที่ /monitor)
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
      note,
      orderType,
      items: cart,
      totalPrice,
      status: "new",
      createdAt: serverTimestamp(),
    };

    try {
      await push(ref(db, "orders"), orderData); // ✅ ใช้ db
      alert("ส่งออเดอร์เรียบร้อยแล้ว ร้านจะเห็นในหน้า Monitor");

      // reset
      setCart([]);
      setCustomerName("");
      setNote("");
      setOrderType("รับที่ร้าน");
      setCopied(false);
    } catch (e) {
      alert("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">ร้านกาแฟมินิมอล</p>
        <h1>กาแฟคุณตุ่ย</h1>
        <p className="hero-text">เมนูชัดเจน สั่งง่าย รับที่ร้านได้ทันที</p>
      </header>

      <main className="main-layout">
        {/* 🍵 เมนู */}
        <section className="menu-section">
          <h2>เมนูกาแฟ</h2>
          <div className="menu-grid">
            {menuItems.map((item) => (
              <div className="menu-card" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="menu-content">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="menu-footer">
                    <strong>{item.price} บาท</strong>
                    <button onClick={() => addToCart(item)}>เพิ่ม</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🧾 ออเดอร์ */}
        <aside className="order-panel">
          <h2>ออเดอร์ของคุณ</h2>

          <div className="form-group">
            <label>ชื่อลูกค้า</label>
            <input
              type="text"
              placeholder="กรอกชื่อของคุณ"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>รูปแบบการรับ</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="รับที่ร้าน">รับที่ร้าน</option>
              <option value="จัดส่ง">จัดส่ง</option>
            </select>
          </div>

          <div className="cart-list">
            {cart.length === 0 ? (
              <p className="empty-cart">ยังไม่มีเมนูในออเดอร์</p>
            ) : (
              cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.price} บาท</p>
                  </div>

                  <div className="qty-control">
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

          <div className="form-group">
            <label>หมายเหตุถึงร้าน</label>
            <textarea
              placeholder="เช่น หวานน้อย ไม่ใส่น้ำตาล เพิ่มช็อต"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="total-box">
            <span>รวมทั้งหมด</span>
            <strong>{totalPrice} บาท</strong>
          </div>

          {copied && <p className="copy-success">✅ คัดลอกออเดอร์แล้ว</p>}

          {/* 📋 Copy + 💬 LINE */}
          <button className="copy-order-btn" onClick={copyOrder}>
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

          {/* 🚀 ส่งเข้า Firebase */}
          <button
            className="submit-btn"
            onClick={submitOrder}
            disabled={sending}
          >
            {sending ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์ให้ร้าน"}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default App;