import "./App.css";
import { useMemo, useState } from "react";
import { ref, push, get, query, orderByChild, equalTo } from "firebase/database";
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

const sugarOptions = [
  { value: "normal", label: "Normal", thai: "ปกติ" },
  { value: "lessSweet", label: "Less sweet", thai: "หวานน้อย" },
  { value: "noSugar", label: "No sugar", thai: "ไม่หวาน" },
];

const LINE_OA_URL = "https://line.me/R/ti/p/@575kncik";

const getTodayDate = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const createOrderNumber = (queueNumber) => {
  return `#${String(queueNumber).padStart(3, "0")}`;
};

const getNextQueueNumber = async () => {
  const today = getTodayDate();

  const ordersRef = ref(db, "orders");
  const todayQuery = query(
    ordersRef,
    orderByChild("orderDate"),
    equalTo(today)
  );

  const snapshot = await get(todayQuery);
  let maxQueue = 0;

  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const order = child.val();
      const queueNumber = Number(order.queueNumber || 0);

      if (queueNumber > maxQueue) {
        maxQueue = queueNumber;
      }
    });
  }

  return maxQueue + 1;
};

const getSweetnessThai = (value) => {
  return sugarOptions.find((option) => option.value === value)?.thai || "ปกติ";
};

function App() {
  const [customerName, setCustomerName] = useState("");
  const [selectedSugar, setSelectedSugar] = useState("normal");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const addToCart = (menuItem) => {
    const cartKey = `${menuItem.id}-${selectedSugar}`;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.cartKey === cartKey);

      if (existingItem) {
        return prevCart.map((item) =>
          item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prevCart,
        {
          cartKey,
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          qty: 1,
          sweetness: selectedSugar,
          sweetnessLabel: getSweetnessThai(selectedSugar),
        },
      ];
    });
  };

  const increaseQty = (cartKey) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (cartKey) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.cartKey === cartKey ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (cartKey) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartKey !== cartKey));
  };

  const handleSubmitOrder = async () => {
    const cleanName = customerName.trim();

    if (!cleanName) {
      alert("กรุณากรอกชื่อลูกค้าก่อนส่งออเดอร์");
      return;
    }

    if (cart.length === 0) {
      alert("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    try {
      setIsSubmitting(true);

      const queueNumber = await getNextQueueNumber();
      const orderNumber = createOrderNumber(queueNumber);
      const orderDate = getTodayDate();

      const newOrder = {
        orderNumber,
        queueNumber,
        orderDate,
        customerName: cleanName,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          sweetness: item.sweetness,
          sweetnessLabel: item.sweetnessLabel,
        })),
        note: note.trim() || "-",
        totalPrice,
        status: "new",
        createdAt: Date.now(),
        time: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      await push(ref(db, "orders"), newOrder);

      setSuccessOrderNumber(orderNumber);
      setCart([]);
      setNote("");

      setTimeout(() => {
        window.location.href = LINE_OA_URL;
      }, 500);
    } catch (error) {
      console.error("Submit order error:", error);
      alert("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app">
      <section className="hero">
        <p className="brand">Tui Cafe</p>
        <h1>Fresh Coffee Order</h1>
        <p>เลือกกาแฟที่คุณชอบ แล้วส่งออเดอร์ให้ร้านได้ทันที</p>
      </section>

      <section className="customer-panel">
        <label className="field-label" htmlFor="customerName">
          ชื่อลูกค้า
        </label>
        <input
          id="customerName"
          className="text-input"
          type="text"
          placeholder="เช่น Tui"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />

        <div className="sugar-section">
          <p className="field-label">ระดับความหวาน</p>
          <div className="sugar-buttons">
            {sugarOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`sugar-btn ${
                  selectedSugar === option.value ? "active" : ""
                }`}
                onClick={() => setSelectedSugar(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="menu-grid">
        {menuItems.map((item) => (
          <article className="menu-card" key={item.id}>
            <img src={item.image} alt={item.name} className="menu-image" />

            <div className="menu-content">
              <h2>{item.name}</h2>
              <p>{item.price} ฿</p>
              <button
                type="button"
                className="add-btn"
                onClick={() => addToCart(item)}
              >
                เพิ่มเมนู
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="order-panel">
        <div className="order-header">
          <div>
            <p className="brand">Your Order</p>
            <h2>รายการออเดอร์</h2>
          </div>
          <strong>{totalPrice} ฿</strong>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">ยังไม่มีรายการ</div>
        ) : (
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.cartKey}>
                <div>
                  <h3>{item.name}</h3>
                  <p>ความหวาน: {item.sweetnessLabel}</p>
                  <p>{item.price} ฿</p>
                </div>

                <div className="cart-actions">
                  <button type="button" onClick={() => decreaseQty(item.cartKey)}>
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => increaseQty(item.cartKey)}>
                    +
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeItem(item.cartKey)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="field-label" htmlFor="note">
          หมายเหตุ
        </label>
        <textarea
          id="note"
          className="note-input"
          placeholder="เช่น ไม่ใส่น้ำแข็ง / แยกน้ำ"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {successOrderNumber && (
          <div className="success-box">
            <p>ส่งออเดอร์สำเร็จ</p>
            <strong>Order {successOrderNumber}</strong>
          </div>
        )}

        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์ให้ร้าน"}
        </button>
      </section>
    </main>
  );
}

export default App;