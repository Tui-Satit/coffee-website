import "./Monitor.css";
import { useEffect, useRef, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "./firebase";

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioRef = useRef(null);
  const firstLoadDone = useRef(false);

  // โหลดเสียง
  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 1;
  }, []);

  // ฟัง Firebase
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

      // 🔊 เล่นเสียงเมื่อมี order ใหม่
      if (firstLoadDone.current && soundEnabled) {
        const hasNew = orderList.some((o) => o.status === "new");

        if (hasNew && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }

      firstLoadDone.current = true;
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  // เปิดเสียง (สำคัญสำหรับ mobile)
  const enableSound = async () => {
    setSoundEnabled(true);

    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      alert("เปิดเสียงแจ้งเตือนแล้ว 🔊");
    } catch (e) {
      console.log(e);
    }
  };

  // รับออเดอร์
  const acceptOrder = async (id) => {
    await update(ref(db, `orders/${id}`), {
      status: "accepted",
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // เช็คมี order ใหม่ไหม
  const hasNewOrder = orders.some((o) => o.status === "new");

  return (
    <div className="monitor-page">
      {/* 🚨 FULLSCREEN ALERT */}
      {hasNewOrder && (
        <div className="fullscreen-alarm">
          🚨 มีออเดอร์ใหม่! กรุณากดรับออเดอร์ 🚨
        </div>
      )}

      <header className="monitor-header">
        <div>
          <h1>📺 Monitor Orders</h1>
          <p>ดูออเดอร์แบบ Real-time</p>
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
              className={`order-card ${
                o.status === "new" ? "alarm-blink" : ""
              }`}
            >
              <h2>👤 New {o.customerName || "-"}</h2>

              <p>📝 หมายเหตุ: {o.note || "-"}</p>

              <p>💵 ราคารวม: {o.total || 0} บาท</p>

              <p>📦 สถานะ: {o.status}</p>

              <div className="order-items">
                <strong>☕ รายการ:</strong>

                {o.items?.map((item, i) => (
                  <div key={i}>
                    - {item.name} x {item.qty} ={" "}
                    {(item.price || 0) * (item.qty || 1)} บาท
                  </div>
                ))}
              </div>

              {o.status === "new" && (
                <button
                  className="accept-button"
                  onClick={() => acceptOrder(o.id)}
                >
                  ✅ รับออเดอร์
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