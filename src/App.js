import "./App.css";

function App() {
  return (
    <div>
      {/* HERO */}
    <section className="hero">
  <div className="overlay">
    <h1>Premium Coffee Experience ☕ New VERSION</h1>
    <p>Freshly brewed coffee in a cozy atmosphere</p>

    <a href="https://line.me/ti/p/~satitMe" target="_blank" rel="noopener noreferrer">
      <button className="line-btn">💬 Chat on LINE</button>
    </a>
  </div>
</section>

      {/* ABOUT */}
      <section className="about">
        <h2>About Us</h2>
        <p>We serve high quality coffee with cozy atmosphere.</p>
      </section>

      {/* MENU */}
     <section className="menu">
  <h2>Our Menu</h2>
  <div className="menu-grid">
    <div className="card">☕ Espresso - 60 THB</div>
    <div className="card">🥛 Latte - 80 THB</div>
    <div className="card">🍫 Cappuccino - 80 THB</div>
  </div>
</section>

      {/* CONTACT */}
      <section className="contact">
        <h2>Contact</h2>
        <p>This is a demo website. I can build a website like this for your business.</p>
        <p>💬 LINE: satitMe</p>
        <p>⚡ Fast response via LINE</p>
      </section>

      {/* FLOATING LINE BUTTON */}
      <a
        href="https://line.me/ti/p/~satitMe"
        target="_blank"
        className="line-button" rel="noopener noreferrer"
      >
        💬 LINE
      </a>
    </div>
  );
}

export default App;