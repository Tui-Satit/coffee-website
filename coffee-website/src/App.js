import { useMemo, useState } from "react";
import "./App.css";

const menuItems = [
  {
    id: 1,
    name: "Espresso",
    price: 60,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Latte",
    price: 80,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "Cappuccino",
    price: 85,
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    name: "Mocha",
    price: 90,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80"
  }
];

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");

  const [orderType, setOrderType] = useState("pickup");

  const addToCart = (item) => {
    setCart((prevCart) => {
      const found = prevCart.find((cartItem) => cartItem.id === item.id);

      if (found) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

    

      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

 
 // ✅ สร้าง orderLines
const orderLines = cart.map(
  (item) =>
    `- ${item.name} x${item.quantity} = ${item.price * item.quantity} THB`
);

// ✅ สร้าง message
const message = `
Name: ${customerName || "Customer"}
Order Type: ${orderType}

Order:
${orderLines.join("\n")}

Total: ${totalPrice} THB
`.trim();

// ✅ สร้าง lineLink (มีแค่ตัวเดียว!)
const lineLink = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;

  return (
    <div className="app">
     <header className="hero">
  <div className="hero-content">
    <h1>☕ Coffee Shop</h1>

    <p className="hero-sub">
      Order your favorite coffee easily from your phone
    </p>

    <p className="hero-info">
      🏪 Pickup or 🚚 Delivery available
    </p>

    <a href="#menu" className="hero-btn">
      Get Your Coffee Now
    </a>
  </div>
</header>

      <section id="menu" className="section">
        <h2>Menu</h2>
        <div className="menu-grid">
          {menuItems.map((item) => (
         <div key={item.id} className="card">
  <img src={item.image} alt={item.name} className="coffee-img" />

  <div className="card-body">
    <h3>{item.name}</h3>
    <p>{item.price} THB</p>

    <button className="add-btn" onClick={() => addToCart(item)}>
      Add to Cart
    </button>
  </div>
</div>  
          ))}
        </div>
      </section>
     
     <section className="section cart-section">
  <div className="summary-card">
    <div className="summary-row">
      <span>Items</span>
      <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
    </div>

    <div className="summary-row">
      <span>Order Type</span>
      <strong>{orderType}</strong>
    </div>

    <div className="summary-row total">
      <span>Total</span>
      <strong>{totalPrice} THB</strong>
    </div>
  </div>

  <h2>Your Cart</h2>

  <div className="customer-box">
    <label htmlFor="customerName">Your Name</label>
    <input
      id="customerName"
      type="text"
      placeholder="Enter your name"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
    />
  </div>

  <div className="order-type">
    <p>Order Type</p>
    <div className="order-type-buttons">
      <button
        className={orderType === "pickup" ? "active" : ""}
        onClick={() => setOrderType("pickup")}
      >
        🏪 Pickup
      </button>

      <button
        className={orderType === "delivery" ? "active" : ""}
        onClick={() => setOrderType("delivery")}
      >
        🚚 Delivery
      </button>
    </div>
  </div>

  {cart.length === 0 ? (
    <p className="empty-cart">Your cart is empty.</p>
  ) : (
    <>
      <div className="cart-list">
        {cart.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-info">
              <strong>{item.name}</strong>
              <p>
                {item.price} THB x {item.quantity}
              </p>
            </div>

            <div className="qty-controls">
              <button onClick={() => decreaseQty(item.id)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => increaseQty(item.id)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <h3 className="total">Total: {totalPrice} THB</h3>
      </div>
    </>
  )}
</section>
     
     



      <a
  href={cart.length === 0 ? "#" : lineLink}
  target="_blank"
  rel="noopener noreferrer"
  className={`floating-order-btn ${cart.length === 0 ? "disabled" : ""}`}
  onClick={(e) => {
    if (cart.length === 0) e.preventDefault();
  }}
>
  💬 Order Now
</a>
    </div>
  );
}



export default App;