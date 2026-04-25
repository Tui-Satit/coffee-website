import "./App.css";
import { useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const SHOP_LINE_ID = "satitme";

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
    setCart((prevCart) => {
      const found = prevCart.find((item) => item.id === menu.id);

      if (found) {
        return prevCart.map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [...prevCart, { ...menu, qty: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const createLineMessage = () => {
    const orderList = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} x ${item.qty} = ${
            item.price * item.qty
          } บาท`
      )
      .join("\n");

    return `☕ ออเดอร์ใหม่จากร้านกาแฟ

👤 ชื่อลูกค้า: ${customerName}
📦 รูปแบบ: ${orderType}

🧾 รายการสั่งซื้อ:
${orderList}

📝 หมายเหตุ:
${note || "-"}

💰 รวมทั้งหมด: ${total} บาท`;
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

    const orderData = {
      customerName: customerName.trim(),
      orderType,
      note: note.trim(),
      items: cart,
      total,
      totalQty,
      status: "new",
      createdAt: serverTimestamp(),
    };

    try {
      await push(ref(db, "orders"), orderData);

      const message = createLineMessage();
      const lineUrl = `https://line.me/R/oaMessage/${SHOP_LINE_ID}/?${encodeURIComponent(
        message
      )}`;

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

        <nav className="nav-links">
          <a href="#home">หน้าแรก</a>
          <a href="#menu">เมนูกาแฟ</a>
        </nav>

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
              เลือกเมนูที่ชอบ เพิ่มลงออเดอร์ แล้วส่งให้ร้านผ่าน LINE ได้ทันที
            </p>
            <a href="#menu" className="hero-button">
              ดูเมนูกาแฟ
            </a>
          </div>
        </section>

        <section id="menu" className="section">
          <div className="section-title">
            <p>Our Menu</p>
            <h2>เมนูกาแฟ</h2>
          </div>

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

            <label>ชื่อลูกค้า</label>
            <input
              type="text"
              placeholder="เช่น คุณตุ่ย"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

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
                      <p>{item.price} บาท</p>
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

            <div className="total-row">
              <strong>รวมทั้งหมด</strong>
              <strong>{total} บาท</strong>
            </div>
            
            <button
  className="send-button"
  onClick={sendOrder}
  disabled={isSending || cart.length === 0}
>
  {isSending ? "⏳ กำลังส่ง..." : "🚀 ส่งออเดอร์ + เพิ่มเพื่อน LINE"}
</button>
           

          </div>
        </section>

        <section className="features">
          <div>🌿 สดใหม่ทุกแก้ว</div>
          <div>❤️ รสชาติดี กลมกล่อม</div>
          <div>🏪 รับที่ร้าน สะดวก รวดเร็ว</div>
        </section>
      </main>
    </div>
  );
}

export default App;