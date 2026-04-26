import "./App.css";
import { useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const LINE_OA_ID = "@575kncik";

const menuItems = [
  {
    id: 1,
    name: "Americano",
    price: 55,
    image:
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80",
    desc: "เข้ม หอม สดชื่น",
  },
  {
    id: 2,
    name: "Latte",
    price: 65,
    image:
      "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80",
    desc: "นุ่ม ละมุน กลมกล่อม",
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 65,
    image:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
    desc: "หอมกาแฟ ฟองนมนุ่ม",
  },
  {
    id: 4,
    name: "Mocha",
    price: 70,
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    desc: "กาแฟผสมช็อกโกแลต",
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("รับที่ร้าน");
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (menu) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === menu.id);

      if (found) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const sendOrder = async () => {
    if (cart.length === 0) {
      alert("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    if (!customerName.trim()) {
      alert("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
      return;
    }

    if (isSending) return;

    setIsSending(true);

    const trimmedCustomerName = customerName.trim();
    const trimmedNote = note.trim();

    const orderData = {
      customerName: trimmedCustomerName,
      orderType,
      note: trimmedNote,
      items: cart,
      total,
      totalQty,
      status: "new",
      createdAt: serverTimestamp(),
    };

    const orderTime = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const divider = "━━━━━━━━━━━━━━";
    const orderLines = [
      "☕ ออเดอร์ใหม่จากเว็บไซต์",
      "",
      divider,
      `👤 ลูกค้า: ${trimmedCustomerName}`,
      `📍 รับสินค้า: ${orderType}`,
      `⏰ เวลา: ${orderTime} น.`,
      divider,
      "",
      "📦 รายการออเดอร์",
      ...cart.map(
        (item) =>
          `• ${item.name} × ${item.qty} — ${item.price * item.qty} บาท`
      ),
      "",
      divider,
      `💰 รวมทั้งหมด: ${total} บาท`,
      `📝 หมายเหตุ: ${trimmedNote || "-"}`,
      "",
      "✅ กรุณาตรวจสอบที่หน้า Monitor",
    ];

    const encodedOrderMessage = encodeURIComponent(orderLines.join("\n"));
    const lineUrl = `https://line.me/R/oaMessage/${LINE_OA_ID}/?${encodedOrderMessage}`;

    try {
      await push(ref(db, "orders"), orderData);
      window.location.href = lineUrl;

      setCart([]);
      setCustomerName("");
      setNote("");
    } catch (error) {
      console.error("ส่งออเดอร์ไม่สำเร็จ:", error);
      alert("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">☕</div>
          <div>
            <h1>ร้านกาแฟมินิมอล</h1>
            <p>สดใหม่ทุกแก้ว</p>
          </div>
        </div>

        

        <div className="cart-badge">
          <span>🛒</span>
          <strong>{totalQty}</strong>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-content">
            <p className="eyebrow">Minimal Coffee</p>
            <h2>กาแฟดี ๆ สำหรับวันทำงานของคุณ</h2>
            <p>
              เลือกเมนูที่ชอบ ส่งออเดอร์ให้ร้าน แล้วดูรายละเอียดที่หน้า Monitor
            </p>
            <a href="#menu" className="hero-button">
             <h2>เมนูกาแฟ</h2> 
            </a>
          </div>
        </section>

        <section id="menu" className="section">
         

          <div className="menu-grid">
            {menuItems.map((menu) => (
              <div className="menu-card" key={menu.id}>
                <img src={menu.image} alt={menu.name} />
                <div className="menu-card-body">
                  <h3>{menu.name}</h3>
                  <p>{menu.desc}</p>

                  <div className="menu-bottom">
                    <strong>{menu.price} บาท</strong>
                    <button onClick={() => addToCart(menu)}>เพิ่ม</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="order-section">
          <div className="order-card">
            <h2>รายการสั่งซื้อ</h2>

            <label>รูปแบบการรับสินค้า</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="รับที่ร้าน">รับที่ร้าน</option>
              <option value="เดลิเวอรี่">เดลิเวอรี่</option>
            </select>

            <div className="cart-list">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>☕ ยังไม่มีเมนูในออเดอร์</p>
                  <span>เลือกเมนูที่คุณชอบได้เลย</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div>
                      <h4>{item.name}</h4>
                      <p>
                        {item.price} บาท x {item.qty}
                      </p>
                    </div>

                    <div className="qty-control">
                      <button onClick={() => decreaseQty(item.id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => increaseQty(item.id)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <label>หมายเหตุถึงร้าน</label>
            <textarea
              placeholder="เช่น หวานน้อย ไม่ใส่น้ำตาล เพิ่มช็อต"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

             <label>ชื่อลูกค้า</label><p className="customer-name-note">*กรุณากรอกชื่อของคุณก่อนส่งออเดอร์</p>
            <input
              type="text"
              placeholder="เช่น คุณตุ่ย"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div className="total-row">
              <strong>รวมทั้งหมด</strong>
              <strong>{total} บาท</strong>
            </div>

            <button
              className="send-button"
              onClick={sendOrder}
              disabled={isSending || cart.length === 0}
            >
              {isSending
                ? "⏳ กำลังส่งออเดอร์..."
                : "🚀 ส่งออเดอร์ผ่าน LINE OA"}
            </button>
          </div>
        </section>

       
      </main>
    </div>
  );
}

export default App;