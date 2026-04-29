import "./App.css";
import { useMemo, useState } from "react";
import { ref, push, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "./firebase";

const menuItems = [
  { id: "americano", name: "Americano", price: 55, image: "/images/americano.jpg" },
  { id: "latte", name: "Latte", price: 65, image: "/images/latte.jpg" },
  { id: "cappuccino", name: "Cappuccino", price: 65, image: "/images/cappuccino.jpg" },
  { id: "mocha", name: "Mocha", price: 70, image: "/images/mocha.jpg" },
];

function App() {
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState([]);
  const [menuOptions, setMenuOptions] = useState({});
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [showToast, setShowToast] = useState(false);

  const getMenuOption = (id) => {
    return menuOptions[id] || {
      temperature: "เย็น",
      sweetness: "ปกติ",
    };
  };

  const updateMenuOption = (id, key, value) => {
    setMenuOptions((prev) => ({
      ...prev,
      [id]: {
        ...getMenuOption(id),
        [key]: value,
      },
    }));
  };

  const addToCart = (item) => {
    const option = getMenuOption(item.id);

    setCart((prev) => [
      ...prev,
      {
        ...item,
        temperature: option.temperature,
        sweetness: option.sweetness,
        cartId: crypto.randomUUID(),
      },
    ]);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1200);
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }, [cart]);

  const createLineMessage = (orderNumber) => {
    const orderList = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} - ${item.price}฿\n   ${item.temperature} / ความหวาน: ${item.sweetness}`
      )
      .join("\n\n");

    return `☕ ออเดอร์ใหม่ ${orderNumber}

ชื่อลูกค้า: ${customerName}

รายการ:
${orderList}

รวมทั้งหมด: ${totalPrice}฿

หมายเหตุ: ${note || "-"}`;
  };

  const submitOrder = async () => {
    if (!customerName.trim()) {
      setErrorMessage("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("กรุณาเลือกเมนูก่อนส่งออเดอร์");
      return;
    }

    setErrorMessage("");

    try {
      const counterRef = ref(db, "orderCounter");

      const result = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

     const nextNumber = Number(result.snapshot.val()) || 1;
     const orderNumber = `#${String(nextNumber).padStart(3, "0")}`;

      const orderData = {
        orderNumber,
        customerName,
        items: cart,
        totalPrice,
        note,
        status: "new",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "orders"), orderData);

      setSuccessOrderNumber(orderNumber);

      const message = createLineMessage(orderNumber);
      const lineUrl = `https://line.me/R/oaMessage/@575kncik/?${encodeURIComponent(message)}`;

      window.open(lineUrl, "_blank");

      setCart([]);
      setNote("");
      setCustomerName("");
    } catch (error) {
      console.error(error);
      setErrorMessage("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="app">
        <button className="floating-cart">
  🛒 <span>{cart.length}</span>
      </button>
      
      {showToast && <div className="toast">เพิ่มลงตะกร้าแล้ว +1</div>}

      <header className="hero">
        <div>
          <p className="eyebrow">Fresh Coffee</p>
          <h1>Tui Cafe</h1>
          <p className="hero-text">เลือกกาแฟที่คุณชอบ แล้วส่งออเดอร์ให้ร้านได้ทันที</p>
        </div>

     
      </header>

      <section className="customer-box">
        <label>ชื่อลูกค้า</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="กรอกชื่อของคุณ"
        />

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successOrderNumber && (
          <p className="success-message">ส่งออเดอร์สำเร็จ {successOrderNumber}</p>
        )}
      </section>

      <main className="menu-grid">
        {menuItems.map((item) => {
          const option = getMenuOption(item.id);

          return (
            <article className="menu-card" key={item.id}>
              <img src={item.image} alt={item.name} className="menu-image" />

              <div className="menu-content">
                <div className="menu-title-row">
                  <div>
                    <h2>{item.name}</h2>
                    <p className="price">{item.price} ฿</p>
                  </div>
                </div>

                <div className="menu-options">
                  <p className="option-label">เลือกแบบ</p>
                  <div className="option-row">
                    {["เย็น", "ร้อน"].map((temp) => (
                      <button
                        key={temp}
                        type="button"
                        className={
                          option.temperature === temp ? "option-pill active" : "option-pill"
                        }
                        onClick={() => updateMenuOption(item.id, "temperature", temp)}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>

                  <p className="option-label">ความหวาน</p>
                  <div className="option-row">
                    {["ปกติ", "หวานน้อย", "ไม่หวาน"].map((sweet) => (
                      <button
                        key={sweet}
                        type="button"
                        className={
                          option.sweetness === sweet ? "option-pill active" : "option-pill"
                        }
                        onClick={() => updateMenuOption(item.id, "sweetness", sweet)}
                      >
                        {sweet}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="add-btn" onClick={() => addToCart(item)}>
                  เพิ่มลงตะกร้า
                </button>
              </div>
            </article>
          );
        })}
      </main>

      <section className="cart-panel">
        <h2>ออเดอร์ของคุณ</h2>

        {cart.length === 0 ? (
          <p className="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((item) => (
                <div className="cart-item" key={item.cartId}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.temperature} / ความหวาน: {item.sweetness}
                    </p>
                    <span>{item.price} ฿</span>
                  </div>

                  <button onClick={() => removeFromCart(item.cartId)}>ลบ</button>
                </div>
              ))}
            </div>

            <div className="note-box">
              <label>หมายเหตุ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ไม่ใส่น้ำแข็งเยอะ / ขอแก้วแยก"
              />
            </div>

            <div className="total-row">
              <span>รวมทั้งหมด</span>
              <strong>{totalPrice} ฿</strong>
            </div>

            <button className="submit-btn" onClick={submitOrder}>
              ส่งออเดอร์ให้ร้าน
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default App;