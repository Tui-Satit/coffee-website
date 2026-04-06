import { useMemo, useState } from "react";
import "./App.css";

const menuItems = [
  { id: 1, name: "Espresso", price: 60 },
  { id: 2, name: "Latte", price: 80 },
  { id: 3, name: "Cappuccino", price: 85 },
  { id: 4, name: "Mocha", price: 90 }
];

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("pickup");

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const message = `
Name: ${customerName || "Customer"}
Order Type: ${orderType}
Total: ${totalPrice} THB
  `.trim();

  const lineLink = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;

  return (
    <div className="app">
      <h1>☕ Coffee Shop</h1>

      <h2>Menu</h2>
      {menuItems.map((item) => (
        <div key={item.id}>
          {item.name} - {item.price} THB
          <button onClick={() => addToCart(item)}>Add</button>
        </div>
      ))}

      <h2>Total: {totalPrice} THB</h2>

      <input
        placeholder="Your name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <br />

      <button
        disabled={cart.length === 0 || customerName.trim() === ""}
        onClick={() => window.open(lineLink)}
      >
        Order Now
      </button>
    </div>
  );
}

export default App;