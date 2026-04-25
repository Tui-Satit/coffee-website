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
        const hasNewOrder = orderList.some((order) => order.status === "new");

        if (hasNewOrder && audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.log("Audio play blocked:", error);
          });
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
        audioRef.current.volume = 1;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      alert("เปิดเสียงแจ้งเตือนแล้ว");
    } catch (error) {
      console.log("Enable sound error:", error);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await update(ref(db, `orders/${orderId}`), {
        status: "accepted",
      });

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (error) {
      console.error("Accept order error:", error);
      alert("กดรับออเดอร์ไม่สำเร็จ");
    }
  };

  const formatTotal = (order) => {
    return order.total || order.totalPrice || 0;
  };

  const formatItemPrice = (item) => {
    const price = item.price || 0;
    const qty = item.qty || 1;
    return price * qty;
  };

  return (
    <div className="monitor-page">
      <header className="monitor-header">
        <div>
          <h1>📺 Monitor Orders</h1>
          <p>ดูออเดอร์ใหม่จากลูกค้าแบบ Real-time</p>
        </div>

        <button className="sound-button" onClick={enableSound}>
          🔊 เปิดเสียงแจ้งเตือน
        </button>
      </header>

      <main className="monitor-content">
        {orders.length === 0 ? (
          <p className="empty-text">ยังไม่มีออเดอร์</p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className={`order-card ${o.status === "new" ? "new-order alarm-blink" : ""}`}
            >
              <div className="order-name">
                👤 New {o.customerName || "ไม่ระบุชื่อ"}
              </div>

              <div>📝 หมายเหตุ: {o.note || "-"}</div>

              <div>
                💵 ราคารวม: {formatTotal(o)} บาท
              </div>

              <div>📦 สถานะ: {o.status || "-"}</div>

              {o.items && o.items.length > 0 && (
                <div className="order-items">
                  <strong>☕ รายการ:</strong>

                  {o.items.map((item, index) => (
                    <div key={index}>
                      - {item.name}{" "}
                      {item.temperature ? `(${item.temperature})` : ""}{" "}
                      {item.sugar ? `• ${item.sugar}` : ""} x {item.qty || 1} ={" "}
                      {formatItemPrice(item)} บาท
                    </div>
                  ))}
                </div>
              )}

              {o.status === "new" && (
                <button
                  className="accept-button"
                  onClick={() => acceptOrder(o.id)}
                >
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