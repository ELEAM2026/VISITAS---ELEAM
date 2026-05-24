import { useState, useEffect } from "react";

// ── Configura aquí ──────────────────────────────────────────
const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
];
const MAX_PER_DAY = 3;
// ────────────────────────────────────────────────────────────

function getMonthDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let d = today.getDate(); d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0) continue;
    const key = date.toISOString().split("T")[0];
    const dayName = date.toLocaleDateString("es-CL", { weekday: "long" });
    const dateStr = date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
    days.push({ key, dayName, dateStr, isToday: d === today.getDate(), dow });
  }
  return days;
}

function slotKey(dayKey, time) {
  return `${dayKey}__${time}`;
}

function getDayVisits(visits, dayKey) {
  return TIME_SLOTS.flatMap(t => visits[slotKey(dayKey, t)] || []);
}

const DOW_COLOR = {
  1: "#3498db",
  2: "#27ae60",
  3: "#e67e22",
  4: "#9b59b6",
  5: "#e74c3c",
  6: "#1abc9c",
};

export default function App() {
  const [visits, setVisits] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [cancelName, setCancelName] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");

  const days = getMonthDays();

  useEffect(() => {
    (() => {
      try {
        const saved = localStorage.getItem("eleam_visits_v2");
        if (saved) setVisits(JSON.parse(saved));
      } catch (_) {}
      setLoading(false);
      if (days.length > 0) setSelectedDay(days[0].key);
    })();
  }, []);

  async function saveVisits(updated) {
    setVisits(updated);
    try {
      localStorage.setItem("eleam_visits_v2", JSON.stringify(updated));
    } catch (_) {}
  }

  function showMsg(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  }

  function getSlot(dayKey, time) {
    return visits[slotKey(dayKey, time)] || [];
  }

  async function addVisit() {
    if (!form.name.trim()) return showMsg("Por favor escribe tu nombre.", "error");
    const dayVisits = getDayVisits(visits, modal.dayKey);
    if (dayVisits.length >= MAX_PER_DAY)
      return showMsg(`Este día ya tiene ${MAX_PER_DAY} visitas agendadas.`, "error");
    const key = slotKey(modal.dayKey, modal.time);
    const current = visits[key] || [];
    const updated = { ...visits, [key]: [...current, { name: form.name.trim() }] };
    await saveVisits(updated);
    setModal(null);
    showMsg(`✅ Visita registrada: ${form.name.trim()}`);
  }

  async function cancelVisit() {
    if (!cancelName.trim()) return showMsg("Ingresa el nombre con que te registraste.", "error");
    const key = slotKey(modal.dayKey, modal.time);
    const current = visits[key] || [];
    const idx = current.findIndex(v => v.name.toLowerCase() === cancelName.trim().toLowerCase());
    if (idx === -1) return showMsg("No se encontró una visita con ese nombre.", "error");
    const updated = { ...visits, [key]: current.filter((_, i) => i !== idx) };
    await saveVisits(updated);
    setModal(null);
    showMsg("🗑️ Visita cancelada.");
  }

  function openSlot(dayKey, time) {
    setForm({ name: "" });
    setCancelName("");
    setModal({ dayKey, time });
  }

  const currentDay = days.find(d => d.key === selectedDay);
  const accent = currentDay ? DOW_COLOR[currentDay.dow] || "#3498db" : "#3498db";

  const monthName = new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#fff",
    }}>
      {/* HEADER */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "18px 20px 14px",
        textAlign: "center",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ fontSize: 26 }}>🏠</div>
        <h1 style={{ margin: "4px 0 2px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
          Visitas ELEAM
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
          Máx. {MAX_PER_DAY} visitas por día · {monthName}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {[["month", "📅 Mes"], ["day", "📋 Día"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 18px", borderRadius: 20, border: "none",
              background: view === v ? accent : "rgba(255,255,255,0.08)",
              color: view === v ? "#fff" : "rgba(255,255,255,0.5)",
              fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* TOAST */}
      {message && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: message.type === "error" ? "#c0392b" : "#27ae60",
          color: "#fff", padding: "11px 22px", borderRadius: 10,
          fontWeight: 600, fontSize: 13, zIndex: 9999,
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
        }}>{message.text}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 80, fontSize: 15 }}>
          Cargando agenda…
        </div>
      ) : (
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px" }}>

          {/* ══ VISTA MES ══ */}
          {view === "month" && (() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const year = today.getFullYear();
            const month = today.getMonth();
            const firstOfMonth = new Date(year, month, 1);
            const lastOfMonth = new Date(year, month + 1, 0);
            const startPad = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
            const cells = [...Array(startPad)].map(() => null);
            for (let d = 1; d <= lastOfMonth.getDate(); d++) {
              const date = new Date(year, month, d);
              const key = date.toISOString().split("T")[0];
              const dow = date.getDay();
              const isPast = date < today;
              const isToday = d === today.getDate();
              const isSun = dow === 0;
              const count = getDayVisits(visits, key).length;
              cells.push({ d, key, dow, isPast, isToday, isSun, count });
            }
            const rows = [];
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
                  {["L","M","X","J","V","S","D"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700, padding: "4px 0" }}>{d}</div>
                  ))}
                </div>
                {rows.map((row, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
                    {row.map((cell, ci) => {
                      if (!cell) return <div key={ci} />;
                      const { d, key, dow, isPast, isToday, isSun, count } = cell;
                      const isFull = count >= MAX_PER_DAY;
                      const isSelected = selectedDay === key;
                      const color = DOW_COLOR[dow] || "#888";
                      return (
                        <button
                          key={ci}
                          disabled={isSun || isPast}
                          onClick={() => { setSelectedDay(key); setView("day"); }}
                          style={{
                            padding: "8px 2px 6px", borderRadius: 10,
                            border: isSelected ? `2px solid ${color}` : isToday ? "2px solid rgba(255,255,255,0.3)" : "2px solid transparent",
                            background: isSelected ? `${color}22` : isSun || isPast ? "transparent" : "rgba(255,255,255,0.04)",
                            color: isSun ? "rgba(255,255,255,0.1)" : isPast ? "rgba(255,255,255,0.18)" : "#fff",
                            cursor: isSun || isPast ? "default" : "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: isToday ? 800 : 500 }}>{d}</span>
                          {!isSun && !isPast && (
                            <div style={{ display: "flex", gap: 2 }}>
                              {[...Array(MAX_PER_DAY)].map((_, i) => (
                                <div key={i} style={{
                                  width: 5, height: 5, borderRadius: "50%",
                                  background: i < count ? (isFull ? "#e74c3c" : "#f39c12") : "rgba(255,255,255,0.12)",
                                }} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
                  {[
                    { color: "rgba(255,255,255,0.12)", label: "Sin visitas" },
                    { color: "#f39c12", label: "Con visitas" },
                    { color: "#e74c3c", label: "Día lleno (3/3)" },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 12, color: "rgba(255,255,255,0.22)", fontSize: 12 }}>
                  Toca un día para ver y agendar horarios
                </div>
              </div>
            );
          })()}

          {/* ══ VISTA DÍA ══ */}
          {view === "day" && currentDay && (
            <div>
              {/* Nav */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <button
                  onClick={() => { const idx = days.findIndex(d => d.key === selectedDay); if (idx > 0) setSelectedDay(days[idx-1].key); }}
                  disabled={days[0]?.key === selectedDay}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 20, cursor: "pointer", opacity: days[0]?.key === selectedDay ? 0.2 : 1 }}
                >‹</button>

                <div style={{ textAlign: "center" }}>
                  <div style={{ color: accent, fontWeight: 800, fontSize: 18, textTransform: "capitalize" }}>{currentDay.dayName}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{currentDay.dateStr}</div>
                  {(() => {
                    const count = getDayVisits(visits, selectedDay).length;
                    const isFull = count >= MAX_PER_DAY;
                    return (
                      <div style={{
                        display: "inline-block", marginTop: 5,
                        padding: "2px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: isFull ? "#e74c3c22" : "#27ae6022",
                        color: isFull ? "#e74c3c" : "#27ae60",
                      }}>
                        {count}/{MAX_PER_DAY} visitas {isFull ? "· DÍA COMPLETO" : "· hay cupo"}
                      </div>
                    );
                  })()}
                </div>

                <button
                  onClick={() => { const idx = days.findIndex(d => d.key === selectedDay); if (idx < days.length-1) setSelectedDay(days[idx+1].key); }}
                  disabled={days[days.length-1]?.key === selectedDay}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 20, cursor: "pointer", opacity: days[days.length-1]?.key === selectedDay ? 0.2 : 1 }}
                >›</button>
              </div>

              {/* Slots */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIME_SLOTS.map(time => {
                  const slot = getSlot(selectedDay, time);
                  const count = slot.length;
                  const dayFull = getDayVisits(visits, selectedDay).length >= MAX_PER_DAY;
                  const dotColor = count > 0 ? "#f39c12" : dayFull ? "rgba(255,255,255,0.15)" : "#27ae60";

                  return (
                    <div
                      key={time}
                      onClick={() => openSlot(selectedDay, time)}
                      style={{
                        background: "rgba(255,255,255,0.05)", borderRadius: 14,
                        padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    >
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: dotColor, flexShrink: 0,
                        boxShadow: count > 0 ? `0 0 8px ${dotColor}90` : "none",
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{time}</div>
                        {count > 0 && (
                          <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {slot.map((v, i) => (
                              <span key={i} style={{
                                background: `${accent}22`, border: `1px solid ${accent}44`,
                                color: "rgba(255,255,255,0.85)", fontSize: 12,
                                padding: "3px 9px", borderRadius: 6,
                              }}>👤 {v.name}</span>
                            ))}
                          </div>
                        )}
                        {count === 0 && (
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 2 }}>
                            {dayFull ? "Día completo — sin cupos" : "Disponible — toca para agendar"}
                          </div>
                        )}
                      </div>
                      {count > 0 && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                          {count} persona{count !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══ MODAL ══ */}
      {modal && (() => {
        const slot = getSlot(modal.dayKey, modal.time);
        const dayFull = getDayVisits(visits, modal.dayKey).length >= MAX_PER_DAY;
        const day = days.find(d => d.key === modal.dayKey);
        const ac = DOW_COLOR[day?.dow] || "#3498db";

        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 600 }}
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
          >
            <div style={{
              background: "#161b22", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "22px 22px 0 0", padding: "22px 20px 36px",
              width: "100%", maxWidth: 540,
              animation: "slideUp 0.28s cubic-bezier(.22,.68,0,1.2)",
            }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "capitalize" }}>
                  {day?.dayName} · {day?.dateStr}
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, marginTop: 2 }}>{modal.time}</div>
                {(() => {
                  const count = getDayVisits(visits, modal.dayKey).length;
                  return (
                    <div style={{
                      display: "inline-block", marginTop: 6,
                      padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: dayFull ? "#e74c3c22" : "#27ae6022",
                      color: dayFull ? "#e74c3c" : "#27ae60",
                    }}>
                      {count}/{MAX_PER_DAY} visitas hoy {dayFull ? "· DÍA COMPLETO" : "· hay cupo"}
                    </div>
                  );
                })()}
              </div>

              {/* ADD */}
              {!dayFull && (
                <div style={{ background: "#27ae6012", border: "1px solid #27ae6030", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>✅ Agendar en este horario</div>
                  <input
                    autoFocus
                    placeholder="Tu nombre completo"
                    value={form.name}
                    onChange={e => setForm({ name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && addVisit()}
                    style={{
                      width: "100%", padding: "11px 13px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff", fontSize: 14, outline: "none",
                      boxSizing: "border-box", marginBottom: 10,
                    }}
                  />
                  <button onClick={addVisit} style={{
                    width: "100%", padding: 12, borderRadius: 10,
                    background: "#27ae60", border: "none",
                    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  }}>Registrar visita</button>
                </div>
              )}

              {/* CANCEL */}
              {slot.length > 0 && (
                <div style={{ background: "#e74c3c12", border: "1px solid #e74c3c30", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ color: "#e74c3c", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🗑️ Cancelar mi visita</div>
                  <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {slot.map((v, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "3px 9px", borderRadius: 6 }}>
                        👤 {v.name}
                      </span>
                    ))}
                  </div>
                  <input
                    placeholder="Tu nombre (tal como lo registraste)"
                    value={cancelName}
                    onChange={e => setCancelName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && cancelVisit()}
                    style={{
                      width: "100%", padding: "11px 13px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff", fontSize: 14, outline: "none",
                      boxSizing: "border-box", marginBottom: 10,
                    }}
                  />
                  <button onClick={cancelVisit} style={{
                    width: "100%", padding: 12, borderRadius: 10,
                    background: "#c0392b", border: "none",
                    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  }}>Cancelar visita</button>
                </div>
              )}

              <button onClick={() => setModal(null)} style={{
                width: "100%", padding: 12, borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>Cerrar</button>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(80px); opacity: 0 }
          to   { transform: translateY(0);   opacity: 1 }
        }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
