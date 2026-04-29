import "./App.css";
import { useMemo, useState } from "react";
import { ref, push, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const LINE_OA_ID = "@575kncik";

const menuItems = [
  { id: "americano", name: "Americano", price: 55, image: "/images/americano.jpg" },
  { id: "latte", name: "Latte", price: 65, image: "/images/latte.jpg" },
  { id: "cappuccino", name: "Cappuccino", price: 65, image: "/images/cappuccino.jpg" },
  { id: "mocha", name: "Mocha", price: 70, image: "/images/mocha.jpg" },
];

const temperatureOptions = ["เย็น", "ร้อน"];
const sweetOptions = ["ปกติ", "หวานน้อย", "ไม่หวาน"];

function formatOrderNumber(number) {
  return `#${String(number).padStart(3, "0")}`;
}

function App() {
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(
    menuItems.reduce((acc, item) => {
      acc[item.id] = {
        temperature: "เย็น",
        sweet: "ปกติ",
      };
      return acc;
    }, {})
  );
  const [nameError, setNameError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const updateOption = (menuId, key, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [key]: value,
      },
    }));
  };

  const addToCart = (menu) => {
    const option = selectedOptions[menu.id];

    setCart((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === menu.id &&
          item.temperature === option.temperature &&
          item.sweet === option.sweet
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === menu.id &&
          item.temperature === option.temperature &&
          item.sweet === option.sweet
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          ...menu,
          temperature: option.temperature,
          sweet: option.sweet,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (cartIndex) => {
    setCart((prev) =>
      prev.map((item, index) =>
        index === cartIndex ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (cartIndex) => {
    setCart((prev) =>
      prev
        .map((item, index) =>
          index === cartIndex ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (cartIndex) => {
    setCart((prev) => prev.filter((_, index) => index !== cartIndex));
  };

  const createLineMessage = (orderNumber) => {
    const itemsText = cart
      .map((item, index) => {
        const itemTotal = item.price * item.quantity;

        return `${index + 1}. ${item.name}
   • ${item.temperature}
   • ความหวาน: ${item.sweet}
   • จำนวน: ${item.quantity}
   • ราคา: ${itemTotal} บาท`;
      })
      .join("\n\n");

    return `☕ Tui Cafe - New Order

ออเดอร์: ${orderNumber}
ชื่อลูกค้า: ${customerName}

รายการ:
${itemsText}

รวมทั้งหมด: ${totalPrice} บาท

หมายเหตุ:
${note || "-"}`;
  };

  const openLineApp = (message) => {
    const encodedMessage = encodeURIComponent(message);

    const lineUrl = `https://line.me/R/oaMessage/${LINE_OA_ID}/?${encodedMessage}`;

    window.open(lineUrl, "_blank");
  };

  const submitOrder = async () => {
    if (!customerName.trim()) {
      setNameError("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
      return;
    }

    if (cart.length === 0) {
      setNameError("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    setNameError("");
    setIsSending(true);

    try {
      const counterRef = ref(db, "orderCounter");

      const counterResult = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      const newOrderNumber = counterResult.snapshot.val();
      const orderNumberText = formatOrderNumber(newOrderNumber);

      const orderData = {
        orderNumber: orderNumberText,
        customerName: customerName.trim(),
        items: cart,
        totalItems,
        totalPrice,
        note: note.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "orders"), orderData);

     const lineMessage = createLineMessage(orderNumberText);
openLineApp(lineMessage);

setTimeout(() => {
  setCustomerName("");
  setNote("");
  setCart([]);
}, 500);
    } catch (error) {
      console.error("Submit order error:", error);
      setNameError("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app">
      {totalItems > 0 && (
        <div className="floating-cart-badge">
          🛒 {totalItems}
        </div>
      )}

      <header className="hero">
        <div>
          <p className="eyebrow">Fresh coffee for you</p>
          <h1>Tui Cafe</h1>
          <p className="hero-text">
            เลือกเมนู ใส่รายละเอียด แล้วส่งออเดอร์เข้าร้านได้ทันที
          </p>
        </div>
      </header>

      <main className="main-layout">
        <section className="menu-section">
          <h2>เมนูกาแฟ</h2>

          <div className="menu-grid">
            {menuItems.map((menu) => (
              <article className="menu-card" key={menu.id}>
                <img src={menu.image} alt={menu.name} />

                <div className="menu-content">
                  <div className="menu-title-row">
                    <h3>{menu.name}</h3>
                    <span>{menu.price}฿</span>
                  </div>

                  <div className="option-group">
                    <p>เลือกแบบ</p>
                    <div className="option-buttons">
                      {temperatureOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            selectedOptions[menu.id].temperature === option
                              ? "option-btn active"
                              : "option-btn"
                          }
                          onClick={() =>
                            updateOption(menu.id, "temperature", option)
                          }
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="option-group">
                    <p>ความหวาน</p>
                    <div className="option-buttons">
                      {sweetOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            selectedOptions[menu.id].sweet === option
                              ? "option-btn active"
                              : "option-btn"
                          }
                          onClick={() => updateOption(menu.id, "sweet", option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => addToCart(menu)}
                  >
                    + เพิ่มลงตะกร้า
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="order-panel">
          <h2>ออเดอร์ของคุณ</h2>

       

          {nameError && <div className="form-error">{nameError}</div>}

          <div className="cart-list">
            {cart.length === 0 ? (
              <p className="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>
            ) : (
              cart.map((item, index) => (
                <div className="cart-item" key={`${item.id}-${index}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.temperature} / {item.sweet}
                    </p>
                    <p>{item.price * item.quantity}฿</p>
                  </div>

                  <div className="qty-controls">
                    <button onClick={() => decreaseQuantity(index)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(index)}>+</button>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeItem(index)}
                  >
                    ลบ
                  </button>
                </div>
              ))
            )}
          </div>

          <label>
            หมายเหตุ
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่ใส่น้ำแข็งเยอะ"
            />
          </label>

          <div className="total-row">
            <span>รวมทั้งหมด</span>
            <strong>{totalPrice}฿</strong>
          </div>
             <label>
             <p>
  กรุณากรอกชื่อลูกค้าก่อนส่งออเดอร์
</p>
            ชื่อลูกค้า
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
            />
          </label>
          <button
            type="button"
            className="send-btn"
            onClick={submitOrder}
            disabled={isSending}
          >
            {isSending ? "กำลังส่งออเดอร์..." : "ส่งออเดอร์ให้ร้าน + เปิด LINE"}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default App;