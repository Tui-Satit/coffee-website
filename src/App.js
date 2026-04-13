import React, { useMemo, useRef, useState } from "react";
import "./App.css";
import { postJson } from "./api";
import { db } from "./firebase";
import { ref, push, set } from "firebase/database";
import ShopPanel from "./ShopPanel";

const PICKUP_MESSAGE = "รับที่ร้าน";
const SUGAR_OPTIONS = ["ปกติ", "หวานน้อย", "ไม่หวาน"];
const DEFAULT_TEMPERATURE_OPTIONS = ["Cold", "Hot"];
const TEMPERATURE_LABELS = {
  Cold: "❄️ เย็น",
  Hot: "🔥 ร้อน"
};

const menu = [
  {
    id: 1,
    name: "Espresso",
    price: 60,
    desc: "กาแฟช็อตเข้มข้น กลมกล่อม",
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    image:
      "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    name: "Latte",
    price: 80,
    desc: "เอสเปรสโซผสมนมนุ่มละมุน",
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    image:
      "https://images.unsplash.com/photo-1561882468-9110e03e0f78?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 80,
    desc: "ฟองนมนุ่มแน่น พร้อมรสกาแฟชัดเจน",
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 4,
    name: "Mocha",
    price: 90,
    desc: "กาแฟช็อกโกแลตหอมหวาน สำหรับสายหวาน",
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    image:
      "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 5,
    name: "Americano",
    price: 70,
    desc: "กาแฟดำรสคลาสสิก ดื่มง่าย",
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80",
  },
];

const menuWithTemperatureOptions = menu.map((item) => ({
  ...item,
  temperatureOptions:
    item.temperatureOptions?.length > 0
      ? item.temperatureOptions
      : DEFAULT_TEMPERATURE_OPTIONS,
}));

function App() {
  const [cart, setCart] = useState([]);
  const submitOrderToFirebase = async () => {
   console.log("clicked submitOrderToFirebase");
   console.log("customerName =", customerName);
   console.log("cart =", cart);

  if (!customerName.trim()) {
    alert("กรุณากรอกชื่อคุณก่อนส่งออเดอร์");
    return;
  }

  if (cart.length === 0) {
    alert("กรุณาเลือกเมนูก่อน");
    return;
  }

  try {
    const ordersRef = ref(db, "orders");
    const newOrderRef = push(ordersRef);

    await set(newOrderRef, {
      customerName: customerName.trim(),
      items: cart,
      totalItems: cart.reduce((sum, item) => sum + item.qty, 0),
      totalPrice: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
      createdAt: Date.now(),
      status: "new"
    });
    
      console.log("order saved to firebase");
    alert("ส่งออเดอร์เรียบร้อยแล้ว ✅");
  } catch (error) {
    console.error("Error sending order:", error);
    alert("ส่งออเดอร์ไม่สำเร็จ");
  }
};
  
  const [addedItemState, setAddedItemState] = useState({});
  const [selectedSugarByItem, setSelectedSugarByItem] = useState(() =>
    menuWithTemperatureOptions.reduce(
      (acc, item) => ({ ...acc, [item.id]: SUGAR_OPTIONS[0] }),
      {}
    )
  );
  const [selectedTemperatureByItem, setSelectedTemperatureByItem] = useState(() =>
    menuWithTemperatureOptions.reduce(
      (acc, item) => ({ ...acc, [item.id]: item.temperatureOptions?.[0] || "Cold" }),
      {}
    )
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [nameValidationNotice, setNameValidationNotice] = useState(false);
  const nameInputRef = useRef(null);

  const addToCart = (item) => {
    const sugar = selectedSugarByItem[item.id] || SUGAR_OPTIONS[0];
    const temperature =
      selectedTemperatureByItem[item.id] || item.temperatureOptions?.[0] || "Cold";

    if (!sugar) {
      alert("กรุณาเลือกระดับความหวานก่อนเพิ่มลงตะกร้า");
      return;
    }

    setCart((prev) => {
      const found = prev.find(
        (p) => p.id === item.id && p.sugar === sugar && p.temperature === temperature
      );
      if (found) {
        return prev.map((p) =>
          p.id === item.id && p.sugar === sugar && p.temperature === temperature
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }
      return [...prev, { ...item, qty: 1, sugar, temperature }];
    });
  };

  const testFirebase = () => {
  set(ref(db, "test"), {
    message: "Hello from Tui Cafe ☕🔥"
  });
};

  const handleAddToCart = (item) => {
    addToCart(item);
    setAddedItemState((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemState((prev) => ({ ...prev, [item.id]: false }));
    }, 1000);
  };

  const handleViewOrder = () => {
    setNameValidationNotice(!customerName.trim());
    setCartOpen(true);
  };

  const updateQty = (id, sugar, temperature, change) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.sugar === sugar && item.temperature === temperature
            ? { ...item, qty: Math.max(0, item.qty + change) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const totalPrice = subtotal;
 

  const summaryRows = [
    { label: "ชื่อลูกค้า", value: customerName.trim() || "-" },
    { label: "บริการ", value: PICKUP_MESSAGE },
    { label: "หมายเหตุ", value: note.trim() || "-" },
  ];

  

  // Delete to here !


  return (
    
    <div className="app">
      <div>
    <h1>Tui Cafe</h1>

    <button onClick={testFirebase}>
      🔥 Test Firebase
    </button>

  </div>
      <header className="shop-sticky-header">
        <div className="shop-pill">กาแฟคุณตุ่ย</div>
      </header>

      <section className="hero">
        <p className="hero-badge">ร้านกาแฟมินิมอล</p>
        <h1>เมนูกาแฟ</h1>
        <p className="hero-text">เมนูชัดเจน สั่งง่าย รับที่ร้านได้ทันที</p>
      </section>

      <main className="menu-section">
        <div className="menu-grid">
          {menuWithTemperatureOptions.map((item) => (
            <div className="menu-card" key={item.id}>
              <div className="menu-image-wrap">
                <img src={item.image} alt={item.name} className="menu-image" />
              </div>

              <div className="menu-content">
                <div>
                  <h3>{item.name}</h3>
                  <p className="menu-desc">{item.desc}</p>
                </div>

                <label className="sugar-field">
                  <span>อุณหภูมิ</span>
                  <select
                    value={
                      selectedTemperatureByItem[item.id] ||
                      item.temperatureOptions?.[0] ||
                      "Cold"
                    }
                    onChange={(e) =>
                      setSelectedTemperatureByItem((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  >
                    {item.temperatureOptions.map((option) => (
                      <option key={option} value={option}>
                        {TEMPERATURE_LABELS[option] || option}
                      </option>

                    
                    ))}
                  </select>
                </label>

                <label className="sugar-field">
                  <span>ระดับความหวาน</span>
                  <select
                    value={selectedSugarByItem[item.id] || SUGAR_OPTIONS[0]}
                    onChange={(e) =>
                      setSelectedSugarByItem((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  >
                    {SUGAR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="menu-footer">
                  <div className="price-block">
                    <span className="price-label">ราคา</span>
                    <strong>฿{item.price}</strong>
                  </div>
                  <button className="add-btn" onClick={() => handleAddToCart(item)}>
                    {addedItemState[item.id] ? "✓ เพิ่มแล้ว" : "+ เพิ่มลงตะกร้า"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {totalItems > 0 && (
        <>
          <button type="button" className="cart-bar" onClick={handleViewOrder}>
            <span className="cart-bar-left">
              <strong>{totalItems} รายการ</strong>
              <span className="cart-bar-hint">แตะเพื่อดูออเดอร์ของคุณ</span>
            </span>
            <span className="cart-bar-price">฿{totalPrice}</span>
          </button>
        </>
      )}

      {cartOpen && <div className="cart-overlay" onClick={() => setCartOpen(false)}></div>}

      <section className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div className="drawer-handle"></div>

        <div className="drawer-header">
          <div>
            <h2>ออเดอร์ของคุณ</h2>
            <p>{totalItems} รายการ</p>
          </div>
          <button className="close-btn" onClick={() => setCartOpen(false)}>
            ✕
          </button>
        </div>

        <div className="form-card">
          <h3 className="card-title">รายละเอียดการสั่งซื้อ</h3>
          <p className="pickup-pill">{PICKUP_MESSAGE}</p>

          <label className="field">
            <span>ชื่อลูกค้า</span>
           <input
  ref={nameInputRef}
  type="text"
  placeholder="กรุณากรอกชื่อคุณก่อนส่งออเดอร์"
  className={nameValidationNotice ? "error-input" : ""}
  value={customerName}
  onChange={(e) => {
    setCustomerName(e.target.value);
    if (nameValidationNotice) {
      setNameValidationNotice(false);
    }
  }}
/>
          </label>

          {nameValidationNotice && <p className="error-text">กรุณากรอกชื่อคุณก่อนส่งออเดอร์</p>}

          <label className="field">
            <span>หมายเหตุถึงร้าน</span>
            <textarea
              rows="3"
              placeholder="เช่น ร้อนพิเศษ แยกน้ำแข็ง..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="drawer-items">
          {cart.map((item) => (
            <div className="drawer-item" key={`${item.id}-${item.sugar}-${item.temperature}`}>
              <div className="drawer-item-left">
                <img src={item.image} alt={item.name} className="drawer-thumb" />
                <div>
                  <h4>{item.name}</h4>
                  <p>
                    {item.temperature} • {item.sugar}
                  </p>
                  <p>
                    ฿{item.price} × {item.qty} = <strong>฿{item.price * item.qty}</strong>
                  </p>
                </div>
              </div>

              <div className="qty-box">
                <button onClick={() => updateQty(item.id, item.sugar, item.temperature, -1)}>
                  -
                </button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.sugar, item.temperature, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="selected-total-card">
          <div className="selected-total-row">
            <span>จำนวนรวม</span>
            <strong>{totalItems} แก้ว</strong>
          </div>
          <div className="selected-total-row selected-total-price">
            <span>ยอดรวมทั้งหมด</span>
            <strong>฿{totalPrice}</strong>
          </div>
        </div>

        <div className="summary-card">
          <h3 className="card-title">สรุปออเดอร์</h3>

          <div className="summary-subcard">
            {summaryRows.map((row) => (
              <div key={row.label} className="summary-row">
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      <button
  type="button"
  className="line-order-btn"
  onClick={
    submitOrderToFirebase
  }
>
  ส่งออเดอร์ผ่าน LINE
</button>
     
      </section>
    </div>
  );
}

export default ShopPanel;
