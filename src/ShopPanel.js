import React, { useEffect, useRef, useState } from "react";
import { db } from "./firebase";
import { onChildAdded, ref, update } from "firebase/database";

function ShopPanel() {
  const [orders, setOrders] = useState([]);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef(null);
  const firstLoadDone = useRef(false);

  const unlockAudio = async () => {
    try {
      if (!audioRef.current) return;
      audioRef.current.volume = 1;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioReady(true);
      alert("เปิดเสียงแจ้งเตือนแล้ว 🔔");
    } catch (error) {
      console.error("unlockAudio error:", error);
      alert("ยังเปิดเสียงไม่ได้ ลองกดอีกครั้ง");
    }
  };

  const playAlert = async () => {
    try {
      if (!audioRef.current || !audioReady) return;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error("playAlert error:", error);
    }
  };

  useEffect(() => {
    const ordersRef = ref(db, "orders");

    const unsubscribe = onChildAdded(ordersRef, async (snapshot) => {
      const order = {
        id: snapshot.key,
        ...snapshot.val(),
      };

      setOrders((prev) => [order, ...prev]);

      if (firstLoadDone.current) {
        await playAlert();
      }
    });

    const timer = setTimeout(() => {
      firstLoadDone.current = true;
    }, 1500);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [audioReady]);

  const markDone = async (id) => {
    try {
      await update(ref(db, `orders/${id}`), {
        status: "done",
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: "done" } : order
        )
      );
    } catch (error) {
      console.error("markDone error:", error);
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>หน้าร้าน Tui Cafe ☕</h1>

      <button
        type="button"
        onClick={unlockAudio}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        {audioReady ? "เสียงพร้อมแล้ว ✅" : "แตะเพื่อเปิดเสียงแจ้งเตือน 🔊"}
      </button>

      <audio ref={audioRef} src="/alert.mp3" preload="auto" />

      {orders.length === 0 ? (
        <p>ยังไม่มีออเดอร์</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 16,
              marginBottom: 14,
              background: order.status === "new" ? "#fff8e1" : "#f3f3f3",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{order.customerName}</h3>
            <p>สถานะ: {order.status}</p>
            <p>รวมทั้งหมด: ฿{order.totalPrice}</p>
            <p>จำนวนแก้ว: {order.totalItems}</p>

            <div>
              <strong>รายการ:</strong>
              {order.items?.map((item, index) => (
                <div key={index}>
                  - {item.name} x {item.qty}
                </div>
              ))}
            </div>

            {order.status !== "done" && (
              <button
                type="button"
                onClick={() => markDone(order.id)}
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ทำเสร็จแล้ว
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ShopPanel;