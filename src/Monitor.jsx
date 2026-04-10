import { useEffect, useRef, useState } from "react";
import { getJson } from "./api";

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [hasUnacceptedOrder, setHasUnacceptedOrder] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousOrderCountRef = useRef(0);
  const beepIntervalRef = useRef(null);

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);

      gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.35);
    } catch (err) {
      console.error("Beep sound error:", err);
    }
  };

  const playLoudPattern = () => {
    playBeep();
    setTimeout(() => playBeep(), 250);
    setTimeout(() => playBeep(), 500);
  };

  const enableSound = async () => {
    setSoundEnabled(true);
    playLoudPattern();
  };

  const handleAcceptOrder = () => {
    setHasUnacceptedOrder(false);

    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getJson("/orders");

        if (data.length > previousOrderCountRef.current) {
          if (previousOrderCountRef.current !== 0) {
            setHasUnacceptedOrder(true);
          }
        }

        previousOrderCountRef.current = data.length;
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasUnacceptedOrder && soundEnabled) {
      playLoudPattern();

      beepIntervalRef.current = setInterval(() => {
        playLoudPattern();
      }, 2500);
    } else {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [hasUnacceptedOrder, soundEnabled]);

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
        🔊 Enable Sound
      </button>

      <h1>☕ Orders Monitor</h1>

      {hasUnacceptedOrder && (
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
            marginBottom: "20px",
          }}
        >
          ✅ รับออเดอร์แล้ว
        </button>
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
                    - {item.name} ({item.temperature || "Hot"}) x {item.qty}
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
