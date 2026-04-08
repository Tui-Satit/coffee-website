import React, { useMemo, useRef, useState } from "react";
import "./App.css";

const SHOP_LINE_ID = "@947ozwwk";
const PICKUP_MESSAGE = "Pickup at shop only";

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

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef(null);
  const quickNoteOptions = ["Less sweet", "No sugar"];


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

  const totalPrice = subtotal;
  const isOrderReady = Boolean(customerName.trim() && cart.length);

  const customerSummaryRows = [
    { label: "Customer", value: customerName.trim() || "-" },
    { label: "Service", value: PICKUP_MESSAGE },
    { label: "Note", value: note.trim() || "-" },
  ];

  const orderSummaryRows = [
    { label: "Subtotal", value: `฿${subtotal}` },
    { label: "Total Items", value: totalItems },
  ];

  const createLineOrderLink = () => {
    if (cart.length === 0) {
      alert("Please add coffee first.");
      return "#";
    }

    const orderText = [
      "☕ New Coffee Order",
      "",
      ...customerSummaryRows.map((row) => `${row.label}: ${row.value}`),
      "",
      "Items:",
      ...cart.map((item) => `- ${item.name} x${item.qty} = ฿${item.price * item.qty}`),
      "",
      ...orderSummaryRows.map((row) => `${row.label}: ${row.value}`),
      `Total Price: ฿${totalPrice}`,
    ].join("\n");

    return `https://line.me/R/oaMessage/${encodeURIComponent(
      SHOP_LINE_ID
    )}/?${encodeURIComponent(orderText)}`;
  };

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

  const applyQuickNote = (quickNote) => {
    setNote((prev) => {
      const trimmedPrev = prev.trim();
      if (!trimmedPrev) return quickNote;
      if (trimmedPrev.toLowerCase().includes(quickNote.toLowerCase())) {
        return prev;
      }
      return `${trimmedPrev}, ${quickNote}`;
    });
  };

  return (
    <div className="app">
      <header className="shop-sticky-header">
        <div className="shop-pill">TUI COFFEE SHOP</div>
      </header>

      <div className="bg-blur bg-blur-1"></div>
      <div className="bg-blur bg-blur-2"></div>

      <section className="hero">
        <p className="hero-badge">Minimal Coffee Store</p>
        <h1>Coffee Menu</h1>
        <p className="hero-text">
          Less sweet and no sugar options are available for every menu item. View the full menu to order.
        </p>
      </section>

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
          <h3 className="card-title">Order Details</h3>
          <p className="pickup-pill">{PICKUP_MESSAGE}</p>

          <label className="field">
            <span>Customer Name</span>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Your name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={nameError ? "error-input" : ""}
            />
            {nameError && <p className="error-text">{nameError}</p>}
            <p className="field-hint">* Please fill your name before ordering.</p>
          </label>


          <label className="field">
            <span>Note to Shop</span>
            <textarea
              rows="3"
              placeholder="Less sweet, no sugar, extra hot..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="quick-note-row">
              {quickNoteOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="quick-note-btn"
                  onClick={() => applyQuickNote(option)}
                >
                  {option}
                </button>
              ))}
            </div>
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
          <h3 className="card-title">Order Summary</h3>

          <div className="summary-subcard">
            {customerSummaryRows.map((row) => (
              <div key={row.label} className="summary-row">
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="summary-subcard">
            {orderSummaryRows.map((row) => (
              <div key={row.label} className="summary-row">
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <hr />
            <div className="summary-total">
              <span>Total Price</span>
              <span>฿{totalPrice}</span>
            </div>
          </div>
        </div>

        <button
          className="line-order-btn"
          onClick={handleOrderWithLine}
          disabled={!isOrderReady}
        >
          Order with LINE
        </button>
      </section>
    </div>
  );
}

export default App;
