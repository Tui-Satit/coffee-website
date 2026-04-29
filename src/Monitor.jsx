import "./Monitor.css";
import { useEffect, useRef, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "./firebase";

const ACTIVE_STATUSES = new Set(["new", "accepted"]);
const BANGKOK_TIME_ZONE = "Asia/Bangkok";

function getTimestamp(value) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "object" && value?.seconds) {
    return value.seconds * 1000;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getBangkokDateKey(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const map = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  });

  return `${map.year}-${map.month}-${map.day}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Monitor() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioRef = useRef(null);
  const firstLoadDone = useRef(false);
  const previousOrderIds = useRef(new Set());

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
        previousOrderIds.current = new Set();
        firstLoadDone.current = true;
        return;
      }

      const orderList = Object.entries(data)
        .map(([id, order]) => ({
          id,
          ...order,
        }))
        .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));

      const currentIds = new Set(orderList.map((order) => order.id));
      const newIncomingOrders = orderList.filter(
        (order) =>
          order.status === "new" && !previousOrderIds.current.has(order.id)
      );

      setOrders(orderList);

      if (firstLoadDone.current && soundEnabled && newIncomingOrders.length > 0) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }

        if (navigator.vibrate) {
          navigator.vibrate([500, 180, 500, 180, 700]);
        }

        setTimeout(() => {
          const firstNewOrder = document.querySelector(".order-card-new");
          firstNewOrder?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      }

      previousOrderIds.current = currentIds;
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

      alert("เปิดเสียงแจ้งเตือนแล้ว");
    } catch (error) {
      console.log("Enable sound error:", error);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const now = Date.now();

      await update(ref(db, `orders/${id}`), {
        status,
        updatedAt: now,
      });

      setOrders((prev) => {
        const nextOrders = prev.map((order) =>
          order.id === id ? { ...order, status, updatedAt: now } : order
        );
        const hasNewOrders = nextOrders.some((order) => order.status === "new");

        if (!hasNewOrders && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        if (!hasNewOrders && navigator.vibrate) {
          navigator.vibrate(0);
        }

        return nextOrders;
      });
    } catch (error) {
      console.error("Update order status error:", error);
      alert("อัปเดตสถานะออเดอร์ไม่สำเร็จ");
    }
  };

  const getTotal = (order) => {
    return Number(order.total || order.totalPrice || 0);
  };

  const getOrderNumber = (order) => {
  if (typeof order.orderNumber === "number") return order.orderNumber;
  if (typeof order.orderNumber === "string") return order.orderNumber;
  if (order.orderNumber?.number) return order.orderNumber.number;
  return order.id?.slice(-3) || "-";
};

 

  const formatOrderTime = (createdAt) => {
    const timestamp = getTimestamp(createdAt);

    if (!timestamp) {
      return "-";
    }

    const formattedTime = new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: BANGKOK_TIME_ZONE,
    }).format(new Date(timestamp));

    return `${formattedTime} น.`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "new":
        return "ออเดอร์ใหม่";
      case "accepted":
        return "รับออเดอร์แล้ว";
      case "done":
        return "ทำเสร็จแล้ว";
      case "cancelled":
        return "ยกเลิกแล้ว";
      default:
        return status || "-";
    }
  };

  const todayKey = getBangkokDateKey(Date.now());

  const todayOrders = orders.filter((order) => {
    return getBangkokDateKey(order.createdAt) === todayKey;
  });

  const todaySales = todayOrders.reduce((sum, order) => {
    if (order.status === "cancelled") {
      return sum;
    }

    return sum + getTotal(order);
  }, 0);

  const liveCount = todayOrders.length;

  return (
    <div className="monitor-page">
      <div className="monitor-bg-orb monitor-bg-orb-a" />
      <div className="monitor-bg-orb monitor-bg-orb-b" />

      <header className="monitor-header">
        <div className="monitor-header-copy">
          <div className="monitor-kicker-row">
            <span className="live-badge">LIVE</span>
            <span className="header-kicker">Coffee Shop Dashboard</span>
          </div>

          <h1>☕ Coffee Monitor</h1>
          <p>Real-time order control center</p>
        </div>

        <div className="monitor-summary-grid">
          <article className="summary-card">
            <span className="summary-label">Today Orders</span>
            <strong className="summary-value">{liveCount}</strong>
          </article>

          <article className="summary-card summary-card-accent">
            <span className="summary-label">Total Sales Today</span>
            <strong className="summary-value">{formatMoney(todaySales)} ฿</strong>
          </article>
        </div>

        <button
          className={`sound-button ${soundEnabled ? "active" : ""}`}
          onClick={enableSound}
          type="button"
        >
          {soundEnabled ? "เปิดแจ้งเตือนแล้ว" : "เปิดเสียงแจ้งเตือน"}
        </button>
      </header>

      <main className="monitor-content">
        {orders.length === 0 ? (
          <section className="empty-state">
            <div className="empty-state-card">
              <span className="empty-state-title">ยังไม่มีออเดอร์</span>
              <p>รอรายการใหม่จากหน้าร้านเพื่อแสดงใน dashboard นี้</p>
            </div>
          </section>
        ) : (
          <section className="orders-grid">
            {orders.map((order) => {
              const status = order.status || "new";
              const isActive = ACTIVE_STATUSES.has(status);
              const isNew = status === "new";
              const isAccepted = status === "accepted";

              return (
                <article key={order.id} className={`order-card order-card-${status}`}>
                  <div className="order-card-glow" />

                  <div className="order-card-header">
                    <div className="order-title-block">
                      <div className="order-title-row">
                        <h2 className="customer-name">
                          {order.customerName || "ไม่ระบุชื่อ"}
                        </h2>
                        <span className={`status-pill status-pill-${status}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="order-subline">
                        <span>เวลา: {formatOrderTime(order.createdAt)}</span>
                     <span>
  ออเดอร์ #{String(getOrderNumber(order)).padStart(3, "0")}
</span>
                      </div>
                    </div>

                    <div className="order-summary">
                      <span className="summary-label">Total</span>
                      <strong className="summary-value">{formatMoney(getTotal(order))} ฿</strong>
                    </div>
                  </div>

                  <div className="order-meta">
                    <div className="meta-row">
                      <span className="meta-label">หมายเหตุ</span>
                      <span className="meta-value">{order.note || "-"}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">สถานะ</span>
                      <span className="meta-value">{getStatusLabel(status)}</span>
                    </div>
                  </div>

               {order.items && order.items.length > 0 && (
  <div className="order-items">
    {order.items.map((item, index) => (
      <div className="order-item" key={`${item.id}-${index}`}>
        <div>
          <strong>{item.name}</strong>
          <p>
            {item.temperature === "Hot" ? "☕ Hot" : "🧊 Iced"} ·{" "}
            {item.sweetness || "Normal"}
          </p>
        </div>

        <span>
          x {item.qty || 1} &nbsp; {item.price * (item.qty || 1)} ฿
        </span>
      </div>
    ))}
  </div>
)}

                  {isActive ? (
                    <div className="order-actions">
                      {isNew ? (
                        <>
                          <button
                            className="action-button action-accept action-accept-pulse"
                            onClick={() => updateOrderStatus(order.id, "accepted")}
                            type="button"
                          >
                            รับออเดอร์แล้ว
                          </button>
                          <button
                            className="action-button action-cancel"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                            type="button"
                          >
                            ยกเลิก
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-button action-done"
                            onClick={() => updateOrderStatus(order.id, "done")}
                            type="button"
                          >
                            ทำเสร็จแล้ว
                          </button>
                          <button
                            className="action-button action-cancel"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                            type="button"
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="completed-note">
                      {isAccepted
                        ? "ออเดอร์กำลังทำงานอยู่"
                        : getStatusLabel(status)}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Monitor;
