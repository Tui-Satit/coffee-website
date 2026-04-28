import "./App.css";
import { useMemo, useState } from "react";
import { ref, push, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const LINE_OA_URL = "https://line.me/R/ti/p/@575kncik";

const menuItems = [
  { id: "americano", name: "Americano", price: 55, image: "/images/americano.jpg" },
  { id: "latte", name: "Latte", price: 65, image: "/images/latte.jpg" },
  { id: "cappuccino", name: "Cappuccino", price: 65, image: "/images/cappuccino.jpg" },
  { id: "mocha", name: "Mocha", price: 70, image: "/images/mocha.jpg" },
];

const sweetOptions = ["Normal", "Sweetless", "No sugar"];

function App() {
  const [customerName, setCustomerName] = useState("");
  const [selectedSweet, setSelectedSweet] = useState("Normal");
  const [temperature, setTemperature] = useState("Iced");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successOrderNumber, setSuccessOrderNumber] = useState("");

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

 

  const addToCart = (coffee) => {
    const newItem = {
      ...coffee,
      qty: 1,
      sweetness: selectedSweet,
      temperature,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.id === newItem.id &&
          item.sweetness === newItem.sweetness &&
          item.temperature === newItem.temperature
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === newItem.id &&
          item.sweetness === newItem.sweetness &&
          item.temperature === newItem.temperature
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prevCart, newItem];
    });
  };

  const decreaseItem = (cartItem) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === cartItem.id &&
          item.sweetness === cartItem.sweetness &&
          item.temperature === cartItem.temperature
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const increaseItem = (cartItem) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === cartItem.id &&
        item.sweetness === cartItem.sweetness &&
        item.temperature === cartItem.temperature
          ? { ...item, qty: item.qty + 1 }
          : item
      )
    );
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
    setErrorMessage("");
    setSuccessOrderNumber("");

    if (!customerName.trim()) {
      setErrorMessage("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    try {
      setIsSending(true);

      const orderNumber = await getNextOrderNumber();

      

      const orderData = {
        orderNumber,
        customerName: customerName.trim(),
        items: cart,
        totalQuantity,
        totalPrice,
        note: note.trim() || "-",
        status: "new",
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      };

      await push(ref(db, "orders"), orderData);

      setSuccessOrderNumber(orderNumber);
      setCart([]);
      setNote("");

      window.location.href = LINE_OA_URL;
    } catch (error) {
      console.error(error);
      setErrorMessage("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="app">

     <div
  className="cart-floating"
  onClick={() => {
    document.querySelector(".cart-card").scrollIntoView({
      behavior: "smooth",
    });
  }}
>
  <span className="cart-emoji">🛒</span>

  {totalQuantity > 0 && (
    <span className="cart-count">{totalQuantity}</span>
  )}
</div>
      

      <section className="hero-card">
        <p className="brand">Tui Cafe</p>
        <h1>Fresh Coffee Order</h1>
        <p>เลือกกาแฟที่คุณชอบ แล้วส่งออเดอร์ให้ร้านได้ทันที</p>
      </section>

      <section className="customer-card">
       

        <label>ระดับความหวาน</label>
        <div className="sweet-row">
          {sweetOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={selectedSweet === option ? "sweet-btn active" : "sweet-btn"}
              onClick={() => setSelectedSweet(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="option-group">
          <p className="option-title">ประเภทเครื่องดื่ม</p>

          <div className="option-buttons">
            <button
              type="button"
              className={temperature === "Iced" ? "active" : ""}
              onClick={() => setTemperature("Iced")}
            >
              Iced 🧊
            </button>

            <button
              type="button"
              className={temperature === "Hot" ? "active" : ""}
              onClick={() => setTemperature("Hot")}
            >
              Hot ☕
            </button>
          </div>
        </div>
      </section>

      <section className="menu-grid">
        {menuItems.map((menu) => (
          <article className="coffee-card menu-card" key={menu.id}>
            <img src={menu.image} alt={menu.name} className="menu-image" />

            <div className="coffee-content">
              <div>
                <h2>{menu.name}</h2>
                <p>{menu.price} ฿</p>
              </div>

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
            <p className="brand">Your Order</p>
            <h2>รายการออเดอร์</h2>
          </div>

          <strong>{totalPrice} ฿</strong>
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">ยังไม่มีรายการ</p>
        ) : (
          <div className="cart-list">
            {cart.map((item) => (
              <div
                className="cart-item"
                key={`${item.id}-${item.sweetness}-${item.temperature}`}
              >
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.temperature === "Hot" ? "☕ Hot" : "🧊 Iced"} ·{" "}
                    {item.sweetness} · {item.price} ฿
                  </p>
                </div>

                <div className="quantity-box">
                  <button type="button" onClick={() => decreaseItem(item)}>
                    -
                  </button>

                  <span>{item.qty}</span>

                  <button type="button" onClick={() => increaseItem(item)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label htmlFor="note">หมายเหตุ</label>
        <textarea
          id="note"
          placeholder="เช่น ไม่ใส่น้ำแข็ง / แยกน้ำ"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {successOrderNumber && (
          <div className="success-box">
            <p>ส่งออเดอร์สำเร็จ</p>
            <strong>Order {successOrderNumber}</strong>
          </div>
        )}

         <label htmlFor="customerName">ชื่อลูกค้า</label>
        <input
          id="customerName"
          type="text"
          placeholder="เช่น Tui"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />

        <button
          type="button"
          className="send-button"
          onClick={sendOrder}
          disabled={isSending}
        >
          {isSending ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์ให้ร้าน"}
        </button>
      </section>
    </main>
  );
}

export default App;