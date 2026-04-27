import "./App.css";
import { useState } from "react";
import { ref, push, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const menuItems = [
  {
    id: 1,
    name: "Americano",
    price: 55,
    image: "/images/americano.jpg",
  },
  {
    id: 2,
    name: "Latte",
    price: 65,
    image: "/images/latte.jpg",
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 65,
    image: "/images/cappuccino.jpg",
  },
  {
    id: 4,
    name: "Mocha",
    price: 70,
    image: "/images/mocha.jpg",
  },
];

const sugarOptions = ["Normal", "Sweetless", "No sugar"];

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
          item.id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...menu, quantity: 1, sugar }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
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
      setError("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
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
            <img src={menu.image} alt={menu.name} />
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
                    {item.sugar} · {item.price} ฿
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