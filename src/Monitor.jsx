import "./Monitor.css";
import { useEffect, useRef, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "./firebase";

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioRef = useRef(null);
  const firstLoadDone = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 1;
  }, []);

  useEffect(() => {
    const ordersRef = ref(db, "orders");

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        firstLoadDone.current = true;
        return;
      }

      const orderList = Object.entries(data)
        .map(([id, order]) => ({
          id,
          ...order,
        }))
        .reverse();

      setOrders(orderList);

      if (firstLoadDone.current && soundEnabled) {
        const hasNew = orderList.some((o) => o.status === "new");

        if (hasNew) {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }

          setTimeout(() => {
            const firstNewOrder = document.querySelector(".order-card-new");
            firstNewOrder?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 300);
        }
      }

      firstLoadDone.current = true;
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  const enableSound = async () => {
    setSoundEnabled(true);

    try {
      if (audioRef.current) {
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      alert("เปิดเสียงแจ้งเตือนแล้ว 🔊");
    } catch (error) {
      console.log("Enable sound error:", error);
    }
  };

  const acceptOrder = async (id) => {
    try {
      await update(ref(db, `orders/${id}`), {
        status: "accepted",
      });

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    } catch (error) {
      console.error("Accept order error:", error);
      alert("รับออเดอร์ไม่สำเร็จ");
    }
  };

  const getTotal = (order) => {
    return order.total || order.totalPrice || 0;
  };

  const getItemTotal = (item) => {
    const price = item.price || 0;
    const qty = item.qty || 1;
    return price * qty;
  };

  const formatOrderTime = (createdAt) => {
    if (createdAt == null) {
      return "-";
    }

    if (typeof createdAt === "object" && createdAt?.seconds) {
      createdAt = createdAt.seconds * 1000;
    }

    const parsedTime =
      typeof createdAt === "number"
        ? createdAt
        : typeof createdAt === "string"
        ? Date.parse(createdAt)
        : NaN;

    if (!Number.isFinite(parsedTime)) {
      return "-";
    }

    const formattedTime = new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(new Date(parsedTime));

    return `${formattedTime} น.`;
  };

  return (
    <div className="monitor-page">
      <header className="monitor-header">
        <div>
          <h1>📺 Monitor Orders</h1>
          <p>ดูออเดอร์ใหม่แบบ Real-time</p>
        </div>

        <button
          className={`sound-button ${soundEnabled ? "active" : ""}`}
          onClick={enableSound}
        >
          {soundEnabled ? "✅ เปิดแจ้งเตือนแล้ว" : "🔊 เปิดเสียงแจ้งเตือน"}
        </button>
      </header>

      <main className="monitor-content">
        {orders.length === 0 ? (
          <p className="empty-text">ยังไม่มีออเดอร์</p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className={`order-card ${
                o.status === "new"
                  ? "order-card-new"
                  : o.status === "accepted"
                  ? "order-card-accepted"
                  : ""
              }`}
            >
              <div className="order-card-header">
                <h2 className="customer-name">👤 {o.customerName || "ไม่ระบุชื่อ"}</h2>
                {o.status === "new" && <span className="new-order-badge">ออเดอร์ใหม่</span>}
              </div>

              <div className="order-meta">
                <p>⏰ เวลา: {formatOrderTime(o.createdAt)}</p>
                <p>📝 หมายเหตุ: {o.note || "-"}</p>
                <p>💵 ราคารวม: {getTotal(o)} บาท</p>
                <p>📦 สถานะ: {o.status || "-"}</p>
              </div>

              {o.items && o.items.length > 0 && (
                <div className="order-items">
                  <strong>☕ รายการ</strong>

                  {o.items.map((item, index) => (
                    <div key={index} className="order-item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x {item.qty || 1}</span>
                      <span className="item-price">{getItemTotal(item)} บาท</span>
                    </div>
                  ))}
                </div>
              )}

              {o.status === "new" && (
                <button className="accept-button" onClick={() => acceptOrder(o.id)}>
                  ✅ รับออเดอร์แล้ว
                </button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Monitor;
