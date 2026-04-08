import React, { useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  const SHOP_LINE_ID = "@947ozwwk";
  
  const menu = [
    {
      id: 1,
      name: "Espresso",
      price: 60,
      desc: "Strong and bold coffee shot.",
      image:
        "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: 2,
      name: "Latte",
      price: 80,
      desc: "Smooth espresso with creamy milk.",
      image:
        "https://images.unsplash.com/photo-1561882468-9110e03e0f78?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: 3,
      name: "Cappuccino",
      price: 80,
      desc: "Rich foam and deep coffee taste.",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: 4,
      name: "Mocha",
      price: 90,
      desc: "Chocolate coffee for sweet lovers.",
      image:
        "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: 5,
      name: "Americano",
      price: 70,
      desc: "Clean and classic black coffee.",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80",
    },
  ];

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("pickup");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef(null);
  
  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, change) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, item.qty + change) } : item
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

  const deliveryFee = orderType === "delivery" && totalItems > 0 ? 30 : 0;
  const totalPrice = subtotal + deliveryFee;

  // ฟังก์ชันสำหรับสร้างลิงก์สั่งซื้อผ่าน LINE

  const createLineOrderLink = () => {
  if (cart.length === 0) {
    alert("Please add coffee first.");
    return "#";
  }

  const orderText = [
    "☕ New Coffee Order",
    "",
    `Name: ${customerName || "-"}`,
    `Order Type: ${orderType === "pickup" ? "Pickup" : "Delivery"}`,
    `Note: ${note || "-"}`,
    "",
    "Items:",
    ...cart.map(
      (item) => `- ${item.name} x${item.qty} = ฿${item.price * item.qty}`
    ),
    "",
    `Subtotal: ฿${subtotal}`,
    `Delivery Fee: ฿${deliveryFee}`,
    `Total Items: ${totalItems}`,
    `Total Price: ฿${totalPrice}`,
  ].join("\n");

  return `https://line.me/R/oaMessage/${encodeURIComponent(
    SHOP_LINE_ID
  )}/?${encodeURIComponent(orderText)}`;
};

  // ฟังก์ชันสำหรับจัดการการสั่งซื้อผ่าน LINE

 const handleOrderWithLine = () => {
  if (!customerName.trim()) {
    setNameError("Fill in your name to order.");

    
    nameInputRef.current?.focus();
    return;
  }

  setNameError("");

  const lineUrl = createLineOrderLink();
  if (lineUrl === "#") return;

  window.location.href = lineUrl;
};

  return (
    <div className="app">
      <div className="bg-blur bg-blur-1"></div>
      <div className="bg-blur bg-blur-2"></div>

      <header className="hero">
        <p className="hero-badge">Premium Coffee</p>
        <h1>Coffee Menu</h1>
        <p className="hero-text">
          Fresh coffee, simple ordering, and smooth mobile experience.
        </p>
      </header>

      <main className="menu-section">
        <div className="menu-grid">
          {menu.map((item) => (
            <div className="menu-card" key={item.id}>
              <div className="menu-image-wrap">
                <img src={item.image} alt={item.name} className="menu-image" />
              </div>

              <div className="menu-content">
                <div>
                  <h3>{item.name}</h3>
                  <p className="menu-desc">{item.desc}</p>
                </div>

                <div className="menu-footer">
                  <div className="price-block">
                    <span className="price-label">PRICE</span>
                    <strong>฿{item.price}</strong>
                  </div>
                  <button className="add-btn" onClick={() => addToCart(item)}>
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {totalItems > 0 && (
        <button className="cart-bar" onClick={() => setCartOpen(true)}>
          <div className="cart-bar-left">
            <strong>{totalItems} items</strong>
            <span>Tap to view your order</span>
          </div>
          <div className="cart-bar-price">฿{totalPrice}</div>
        </button>
      )}

      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}></div>
      )}

      <section className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div className="drawer-handle"></div>

        <div className="drawer-header">
          <div>
            <h2>Your Order</h2>
            <p>{totalItems} items selected</p>
          </div>
          <button className="close-btn" onClick={() => setCartOpen(false)}>
            ✕
          </button>
        </div>

        <div className="form-card">
        <label className="field">
  <span>Customer Name</span>
  <input
    ref={nameInputRef}
    type="text"
    placeholder="Your name"
    value={customerName}
    onChange={(e) => {
      setCustomerName(e.target.value);
      if (e.target.value.trim()) {
        setNameError("");
      }
    }}
    className={nameError ? "error-input" : ""}
  />
  {nameError && <p className="error-text">{nameError}</p>}
</label>

          <div className="field">
            <span>Order Type</span>
            <div className="type-switch">
              <button
                className={orderType === "pickup" ? "active" : ""}
                onClick={() => setOrderType("pickup")}
              >
                Pickup
              </button>
              <button
                className={orderType === "delivery" ? "active" : ""}
                onClick={() => setOrderType("delivery")}
              >
                Delivery
              </button>
            </div>
          </div>

          <label className="field">
            <span>Note to Shop</span>
            <textarea
              rows="3"
              placeholder="Less sweet, no sugar, extra hot..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="drawer-items">
          {cart.map((item) => (
            <div className="drawer-item" key={item.id}>
              <div className="drawer-item-left">
                <img src={item.image} alt={item.name} className="drawer-thumb" />
                <div>
                  <h4>{item.name}</h4>
                  <p>฿{item.price} each</p>
                </div>
              </div>

              <div className="qty-box">
                <button onClick={() => updateQty(item.id, -1)}>-</button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-card">
          <div><span>Subtotal</span><span>฿{subtotal}</span></div>
          <div><span>Delivery Fee</span><span>฿{deliveryFee}</span></div>
          <div><span>Total Items</span><span>{totalItems}</span></div>
          <hr />
          <div className="summary-total">
            <span>Total Price</span>
            <span>฿{totalPrice}</span>
          </div>
        </div>
              
             
       <button className="line-order-btn" onClick={handleOrderWithLine}>
  Order with LINE
</button>

        
      </section>
    </div>
  );
}

export default App;