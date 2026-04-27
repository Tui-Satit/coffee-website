import "./App.css";
import { useState } from "react";
import { ref, push, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const lineOrderUrl = "https://line.me/ti/p/@575kncik";
const imageFallback =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img" aria-label="Coffee illustration fallback">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6d3f24" />
          <stop offset="100%" stop-color="#1f130d" />
        </linearGradient>
        <linearGradient id="cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff6ee" />
          <stop offset="100%" stop-color="#d6c0ae" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="40" fill="url(#bg)" />
      <ellipse cx="320" cy="330" rx="180" ry="26" fill="rgba(0,0,0,0.28)" />
      <path d="M210 150h190c8 0 15 7 15 15v82c0 53-43 96-96 96h-28c-53 0-96-43-96-96v-82c0-8 7-15 15-15z" fill="url(#cup)" />
      <path d="M416 177h28c23 0 42 19 42 42s-19 42-42 42h-26" fill="none" stroke="#e6d5c9" stroke-width="18" stroke-linecap="round" />
      <path d="M260 188c-15 28-10 54 10 72" fill="none" stroke="#8f5634" stroke-width="12" stroke-linecap="round" opacity=".7" />
      <path d="M318 178c-14 25-10 49 8 66" fill="none" stroke="#8f5634" stroke-width="12" stroke-linecap="round" opacity=".7" />
      <path d="M376 188c-15 28-10 54 10 72" fill="none" stroke="#8f5634" stroke-width="12" stroke-linecap="round" opacity=".7" />
      <path d="M238 140c0-25 18-42 18-64" fill="none" stroke="#f1d6b6" stroke-width="10" stroke-linecap="round" opacity=".8" />
      <path d="M292 132c0-24 18-40 18-60" fill="none" stroke="#f1d6b6" stroke-width="10" stroke-linecap="round" opacity=".8" />
      <path d="M348 140c0-25 18-42 18-64" fill="none" stroke="#f1d6b6" stroke-width="10" stroke-linecap="round" opacity=".8" />
      <text x="320" y="372" text-anchor="middle" fill="#f8e7d8" font-family="Arial, sans-serif" font-size="28" font-weight="700">Coffee Time</text>
    </svg>
  `);

const menuItems = [
  {
    id: 1,
    name: "Americano",
    price: 55,
    image: "/images/americano.svg",
  },
  {
    id: 2,
    name: "Latte",
    price: 65,
    image: "/images/latte.svg",
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 65,
    image: "/images/cappuccino.svg",
  },
  {
    id: 4,
    name: "Mocha",
    price: 70,
    image: "/images/mocha.svg",
  },
];

const sugarOptions = ["Normal", "Less sweet", "No sugar"];

function App() {
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [sugar, setSugar] = useState("Normal");
  const [isSending, setIsSending] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [error, setError] = useState("");

  const totalPrice = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const addToCart = (menu) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === menu.id);

      if (found) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...menu, quantity: 1, sugar }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCart([]);
    setNote("");
    setSuccessOrder(null);
    setError("");
  };

  const handleImageError = (event) => {
    if (event.currentTarget.dataset.fallbackApplied === "true") {
      return;
    }

    event.currentTarget.dataset.fallbackApplied = "true";
    event.currentTarget.src = imageFallback;
    event.currentTarget.classList.add("image-fallback");
  };

  const getNextOrderNumber = async () => {
    const counterRef = ref(db, "orderCounter/today");

    const result = await runTransaction(counterRef, (currentValue) => {
      return (currentValue || 0) + 1;
    });

    const nextNumber = result.snapshot.val();
    return `#${String(nextNumber).padStart(3, "0")}`;
  };

  const sendOrder = async () => {
    setError("");
    setSuccessOrder(null);

    if (!customerName.trim()) {
      setError("กรุณากรอกชื่อก่อนส่งออเดอร์");
      return;
    }

    if (cart.length === 0) {
      setError("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    try {
      setIsSending(true);

      const orderNumber = await getNextOrderNumber();

      const orderData = {
        orderNumber,
        customerName: customerName.trim(),
        items: cart,
        totalPrice,
        note: note.trim() || "-",
        status: "new",
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      };

      await push(ref(db, "orders"), orderData);

      setSuccessOrder(orderNumber);
      setCart([]);
      setNote("");
      setIsSending(false);

      window.setTimeout(() => {
        window.location.href = lineOrderUrl;
      }, 700);
      return;
    } catch (err) {
      console.error(err);
      setError("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Tui Cafe</p>
          <h1>Fresh Coffee Order</h1>
          <p className="hero-text">
            เลือกกาแฟที่คุณชอบ แล้วส่งออเดอร์ให้ร้านได้ทันที
          </p>
        </div>
      </section>

      <section className="customer-card">
        <label>ชื่อลูกค้า</label>
        <input
          type="text"
          placeholder="เช่น Tui"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <label>ระดับความหวาน</label>
        <div className="option-row">
          {sugarOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={sugar === option ? "option active" : "option"}
              onClick={() => setSugar(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-grid">
        {menuItems.map((menu) => (
          <article className="coffee-card" key={menu.id}>
            <img
              src={menu.image}
              alt={menu.name}
              className="menu-image"
              onError={handleImageError}
            />
            <div className="coffee-info">
              <h2>{menu.name}</h2>
              <p>{menu.price} ฿</p>
              <button type="button" onClick={() => addToCart(menu)}>
                เพิ่มเมนู
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="cart-card">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Your Order</p>
            <h2>รายการออเดอร์</h2>
          </div>
          <strong>{totalPrice} ฿</strong>
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">ยังไม่มีรายการ</p>
        ) : (
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.sugar} x {item.price} ฿
                  </p>
                </div>

                <div className="qty-control">
                  <button type="button" onClick={() => removeFromCart(item.id)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => addToCart(item)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label>หมายเหตุ</label>
        <textarea
          placeholder="เช่น ไม่ใส่น้ำแข็ง / แยกน้ำ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p className="error-message">{error}</p>}

        {successOrder && (
          <div className="success-box">
            <p>ส่งออเดอร์สำเร็จ</p>
            <strong>Order {successOrder}</strong>
          </div>
        )}

        <button
          type="button"
          className="send-button"
          onClick={sendOrder}
          disabled={isSending}
        >
          {isSending ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์ให้ร้าน"}
        </button>

        {cart.length > 0 && (
          <button type="button" className="clear-button" onClick={clearCart}>
            ล้างรายการ
          </button>
        )}
      </section>
    </main>
  );
}

export default App;
