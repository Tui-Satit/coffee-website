import { useEffect, useRef, useState } from "react";
import { getJson } from "./api";

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [hasUnacceptedOrder, setHasUnacceptedOrder] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const previousOrderCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/coffee_bell.wav");
    audioRef.current.loop = true;
    audioRef.current.volume = 1.0;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const enableSound = async () => {
    try {
      if (!audioRef.current) return;

      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setSoundEnabled(true);
      alert("เปิดเสียงแจ้งเตือนแล้ว");
    } catch (err) {
      console.error("Enable sound failed:", err);
      alert("ไม่สามารถเปิดเสียงได้");
    }
  };

  const handleAcceptOrder = () => {
    setHasUnacceptedOrder(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getJson("/orders");

        if (
          data.length > previousOrderCountRef.current &&
          previousOrderCountRef.current !== 0
        ) {
          setHasUnacceptedOrder(true);

          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
              console.error("Audio play blocked:", err);
            });
          }
        }

        previousOrderCountRef.current = data.length;
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <button
        onClick={enableSound}
        style={{
          padding: "12px 18px",
          fontSize: "18px",
          marginBottom: "16px",
          cursor: "pointer",
          borderRadius: "8px",
          border: "none",
          background: "#222",
          color: "#fff",
        }}
      >
        🔊 เปิดเสียงแจ้งเตือน
      </button>

      <h1>☕ Orders Monitor</h1>

      {hasUnacceptedOrder && (
        <div
          style={{
            backgroundColor: "#ff4d4f",
            color: "white",
            border: "none",
            padding: "16px 20px",
            fontSize: "22px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "12px" }}>
            🔔 มีออเดอร์ใหม่!
          </div>

          <button
            onClick={handleAcceptOrder}
            style={{
              backgroundColor: "green",
              color: "white",
              border: "none",
              padding: "14px 22px",
              fontSize: "20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ✅ รับออเดอร์แล้ว
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <p>ยังไม่มีออเดอร์</p>
      ) : (
        orders.map((o, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "12px",
              background: "#fff8f0",
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              👤 {o.customerName || "ไม่ระบุชื่อ"}
            </div>

            <div>🕒 เวลารับ: {o.pickupTime || "-"}</div>
            <div>📝 หมายเหตุ: {o.note || "-"}</div>
            <div>💵 ราคารวม: {o.totalPrice || "-"} บาท</div>

            {o.items && o.items.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>☕ รายการ:</strong>
                {o.items.map((item, index) => (
                  <div key={index}>
                    - {item.name} ({item.temperature || "Cold"}) x {item.qty}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Monitor;