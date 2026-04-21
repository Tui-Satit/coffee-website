import { useCallback, useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import "./Monitor.css";

const ALERT_SOUND_SRC = "/alert.mp3";
const BURST_DELAYS_MS = [0, 180, 360, 700];
const REPEAT_ALERT_MS = 2500;

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [hasUnacceptedOrder, setHasUnacceptedOrder] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const previousOrderCountRef = useRef(0);
  const audioTemplateRef = useRef(null);
  const repeatIntervalRef = useRef(null);
  const burstTimeoutsRef = useRef([]);
  const activeAudiosRef = useRef([]);

  const clearBurstTimeouts = useCallback(() => {
    burstTimeoutsRef.current.forEach((id) => clearTimeout(id));
    burstTimeoutsRef.current = [];
  }, []);

  const stopAllAudio = useCallback(() => {
    clearBurstTimeouts();

    activeAudiosRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (err) {
        console.error("stop audio error:", err);
      }
    });
    activeAudiosRef.current = [];

    if (audioTemplateRef.current) {
      try {
        audioTemplateRef.current.pause();
        audioTemplateRef.current.currentTime = 0;
      } catch (err) {
        console.error("template audio stop error:", err);
      }
    }

    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, [clearBurstTimeouts]);

  const playAlertBurst = useCallback(() => {
    if (!soundEnabled || !audioTemplateRef.current) return;

    clearBurstTimeouts();

    BURST_DELAYS_MS.forEach((delay, index) => {
      const timeoutId = setTimeout(() => {
        const alertAudio = audioTemplateRef.current.cloneNode();
        alertAudio.volume = 1.0;
        alertAudio.playbackRate = index === 0 ? 1.0 : 1.12;

        activeAudiosRef.current.push(alertAudio);

        alertAudio
          .play()
          .catch((err) => console.error("Audio play failed:", err))
          .finally(() => {
            activeAudiosRef.current = activeAudiosRef.current.filter(
              (audio) => audio !== alertAudio
            );
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
      alert("เปิดเสียงแจ้งเตือนแล้ว 🔔");
    } catch (err) {
      console.error("Enable sound failed:", err);
      alert("ไม่สามารถเปิดเสียงได้ ลองกดอีกครั้ง");
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

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();

      const orderList = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }))
        : [];

      if (
        orderList.length > previousOrderCountRef.current &&
        previousOrderCountRef.current !== 0
      ) {
        setHasUnacceptedOrder(true);

        if (soundEnabled) {
          playAlertBurst();

          if ("vibrate" in navigator) {
            navigator.vibrate([300, 150, 300, 150, 600]);
          }
        }
      }

      previousOrderCountRef.current = orderList.length;
      setOrders(orderList.reverse());
    });

    return () => unsubscribe();
  }, [playAlertBurst, soundEnabled]);

  useEffect(() => {
    if (hasUnacceptedOrder && soundEnabled) {
      playAlertBurst();

      if ("vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 600]);
      }

      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }

      repeatIntervalRef.current = setInterval(() => {
        playAlertBurst();

        if ("vibrate" in navigator) {
          navigator.vibrate([220, 120, 220, 120, 400]);
        }
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
    <div className={`monitor-page ${hasUnacceptedOrder ? "monitor-page-alert" : ""}`}>
      {hasUnacceptedOrder && (
        <div className="fullscreen-alarm alert-blink">
          <div className="fullscreen-alarm-content">
            <div className="fullscreen-alarm-icon">🚨</div>
            <div className="fullscreen-alarm-title">มีออเดอร์ใหม่!</div>
            <div className="fullscreen-alarm-subtitle">
              กรุณากดรับออเดอร์เพื่อหยุดเสียงและหยุดกระพริบ
            </div>

            <button
              onClick={handleAcceptOrder}
              className="accept-button fullscreen-accept-button"
            >
              ✅ รับออเดอร์แล้ว
            </button>
          </div>
        </div>
      )}

      <div className="monitor-topbar">
        <button
          onClick={enableSound}
          className={`sound-button ${soundEnabled ? "sound-button-ready" : ""}`}
        >
          {soundEnabled ? "🔔 เสียงพร้อมแล้ว" : "🔊 เปิดเสียงแจ้งเตือน"}
        </button>
      </div>

      <h1 className="monitor-title">☕ Orders Monitor</h1>

      {orders.length === 0 ? (
        <p className="empty-text">ยังไม่มีออเดอร์</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="order-card">
            <div className="order-name">👤 {o.customerName || "ไม่ระบุชื่อ"}</div>
            <div>📝 หมายเหตุ: {o.note || "-"}</div>
            <div>💵 ราคารวม: {o.totalPrice || "-"} บาท</div>
            <div>📦 สถานะ: {o.status || "-"}</div>

            {o.items && o.items.length > 0 && (
              <div className="order-items">
                <strong>☕ รายการ:</strong>
                {o.items.map((item, index) => (
                  <div key={index}>
                    - {item.name} ({item.temperature || "Cold"}) •{" "}
                    {item.sugar || "ปกติ"} x {item.qty}
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