import { useCallback, useEffect, useRef, useState } from "react";
import { ref, onChildAdded } from "firebase/database";
import { db } from "./firebase";

const ALERT_SOUND_SRC = "/alert.mp3";
const BURST_DELAYS_MS = [0, 90, 180, 270, 360, 450];
const REPEAT_ALERT_MS = 1200;

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [hasUnacceptedOrder, setHasUnacceptedOrder] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioTemplateRef = useRef(null);
  const repeatIntervalRef = useRef(null);
  const burstTimeoutsRef = useRef([]);
  const activeAudiosRef = useRef([]);
  const initialLoadDoneRef = useRef(false);

  const clearBurstTimeouts = useCallback(() => {
    burstTimeoutsRef.current.forEach((id) => clearTimeout(id));
    burstTimeoutsRef.current = [];
  }, []);

  const stopAllAudio = useCallback(() => {
    clearBurstTimeouts();

    activeAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudiosRef.current = [];

    if (audioTemplateRef.current) {
      audioTemplateRef.current.pause();
      audioTemplateRef.current.currentTime = 0;
    }
  }, [clearBurstTimeouts]);

  const playAlertBurst = useCallback(() => {
    if (!soundEnabled || !audioTemplateRef.current) return;

    clearBurstTimeouts();

    BURST_DELAYS_MS.forEach((delay) => {
      const timeoutId = setTimeout(() => {
        const alertAudio = audioTemplateRef.current.cloneNode();

// 👇 เพิ่ม/แก้ตรงนี้
alertAudio.volume = 1.0;
alertAudio.muted = false;
alertAudio.playbackRate = 1.3;
if (navigator.vibrate) {
  navigator.vibrate([200, 100, 200]);
}


        activeAudiosRef.current.push(alertAudio);

        alertAudio.play().catch((err) => {
          console.error("Audio play failed:", err);
        });
      }, delay);

      burstTimeoutsRef.current.push(timeoutId);
    });
  }, [clearBurstTimeouts, soundEnabled]);

  useEffect(() => {
    const audio = new Audio(ALERT_SOUND_SRC);
    audio.volume = 1.0;
    audio.preload = "auto";
    audioTemplateRef.current = audio;

    return () => {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
      stopAllAudio();
    };
  }, [stopAllAudio]);

  const enableSound = async () => {
    try {
      if (!audioTemplateRef.current) return;

      await audioTemplateRef.current.play();
      audioTemplateRef.current.pause();
      audioTemplateRef.current.currentTime = 0;

      setSoundEnabled(true);
      alert("เปิดเสียงแจ้งเตือนแล้ว");
    } catch (err) {
      console.error("Enable sound failed:", err);
      alert("ไม่สามารถเปิดเสียงได้");
    }
  };

  const handleAcceptOrder = () => {
    setHasUnacceptedOrder(false);

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    stopAllAudio();
  };

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    let firstSnapshot = true;

    const unsubscribe = onChildAdded(ordersRef, (snapshot) => {
      const newOrder = {
        id: snapshot.key,
        ...snapshot.val(),
      };

      setOrders((prev) => {
        const exists = prev.some((order) => order.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      if (firstSnapshot && !initialLoadDoneRef.current) {
        return;
      }

      setHasUnacceptedOrder(true);
    });

    const markLoaded = setTimeout(() => {
      initialLoadDoneRef.current = true;
      firstSnapshot = false;
    }, 1000);

    return () => {
      clearTimeout(markLoaded);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hasUnacceptedOrder && soundEnabled) {
      playAlertBurst();

      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }

      repeatIntervalRef.current = setInterval(() => {
        playAlertBurst();
      }, REPEAT_ALERT_MS);
    } else {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
      stopAllAudio();
    }

    return () => {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
    };
  }, [hasUnacceptedOrder, playAlertBurst, soundEnabled, stopAllAudio]);

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
        orders.map((o) => {
          const itemsArray = Array.isArray(o.items)
            ? o.items
            : o.items
            ? Object.values(o.items)
            : [];

          return (
            <div
              key={o.id}
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

              {itemsArray.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <strong>☕ รายการ:</strong>
                  {itemsArray.map((item, index) => (
                    <div key={index}>
                      - {item.name} ({item.temperature || "Cold"}) x {item.qty}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Monitor;