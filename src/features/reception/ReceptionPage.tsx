import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppShell from "../../components/layout/AppShell";
import useReceptionStore from "../../store/useReceptionStore";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from "../../interfaces/purchaseOrders";

// ─── helpers ────────────────────────────────────────────────────────────────

const statusPill = (status: string) => {
  switch (status) {
    case "pendiente":
      return <span className="pill pill--warn">Pendiente</span>;
    case "parcialmente_recibida":
      return <span className="pill pill--amber">Parcial</span>;
    case "completada":
      return <span className="pill pill--ok">Completada</span>;
    default:
      return <span className="pill pill--muted">{status}</span>;
  }
};

// ─── types ───────────────────────────────────────────────────────────────────

interface ReceptionForm {
  orderId: string;
  itemId: string;
  productId: string;
  productName: string;
  productSku: string;
  ordered: number;
  received: number;
  locationId: string;
  lotCode: string;
  expirationDate: string;
  serialNumbers: string;
  discrepancyNote: string;
  coldChainAck: boolean;
  electricalSafetyAck: boolean;
}

const emptyForm = (): ReceptionForm => ({
  orderId: "",
  itemId: "",
  productId: "",
  productName: "",
  productSku: "",
  ordered: 0,
  received: 0,
  locationId: "",
  lotCode: "",
  expirationDate: "",
  serialNumbers: "",
  discrepancyNote: "",
  coldChainAck: false,
  electricalSafetyAck: false,
});

// ─── component ────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const { t } = useTranslation();
  const {
    pendingOrders,
    loading,
    error,
    fetchPendingOrders,
    receiveItem,
    clearError,
  } = useReceptionStore();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ReceptionForm>(emptyForm());
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return pendingOrders;
    const q = search.toLowerCase();
    return pendingOrders.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.supplier_nombre.toLowerCase().includes(q) ||
        o.items.some(
          (i) =>
            i.product_name.toLowerCase().includes(q) ||
            i.product_sku.toLowerCase().includes(q),
        ),
    );
  }, [pendingOrders, search]);

  const hasDiscrepancy =
    form.ordered > 0 && form.received > 0 && form.received !== form.ordered;

  function selectItem(order: PurchaseOrder, item: PurchaseOrderItem) {
    setForm({
      ...emptyForm(),
      orderId: order.id,
      itemId: item.id,
      productId: item.product,
      productName: item.product_name,
      productSku: item.product_sku,
      ordered: item.quantity_ordered,
      received: item.quantity_pending,
    });
    setStep(2);
    setFormError("");
    setSuccessMsg("");
  }

  function clearSelection() {
    setForm(emptyForm());
    setStep(1);
    setFormError("");
  }

  async function handleConfirm() {
    if (!form.productId || !form.locationId) {
      setFormError("Selecciona ubicación destino");
      return;
    }
    if (form.received <= 0) {
      setFormError("La cantidad recibida debe ser mayor a 0");
      return;
    }
    if (hasDiscrepancy && !form.discrepancyNote.trim()) {
      setFormError("Debes agregar una nota de discrepancia (BR-09)");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await receiveItem({
        purchase_order_id: form.orderId,
        items: [
          {
            purchase_order_item_id: form.itemId,
            quantity_received: form.received,
            lot_code: form.lotCode || undefined,
            lot_expiration_date: form.expirationDate || undefined,
          },
        ],
        destination_location_id: form.locationId,
        notes: form.discrepancyNote || undefined,
      });
      setSuccessMsg(`Entrada registrada para ${form.productSku}`);
      setStep(3);
    } catch {
      setFormError("No se pudo registrar la entrada. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={t("reception.title")} subtitle={t("reception.subtitle")}>
      <div className="page-body">
        {/* ── step track ── */}
        <nav
          className="step-track"
          aria-label="Progreso del flujo de recepción"
        >
          <div
            className={`step-item${step >= 1 ? (step > 1 ? " step-item--done" : " step-item--active") : ""}`}
            aria-current={step === 1 ? "step" : undefined}
          >
            <div className="step-num">1</div>
            <span>Identificar</span>
          </div>
          <div
            className={`step-item${step >= 2 ? (step > 2 ? " step-item--done" : " step-item--active") : ""}`}
            aria-current={step === 2 ? "step" : undefined}
          >
            <div className="step-num">2</div>
            <span>Cantidad</span>
          </div>
          <div
            className={`step-item${step === 3 ? " step-item--done" : ""}`}
            aria-current={step === 3 ? "step" : undefined}
          >
            <div className="step-num">3</div>
            <span>Confirmar</span>
          </div>
        </nav>

        {/* ── error global ── */}
        {error && (
          <div className="alert-bar alert-bar--err mb-20" role="alert">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              width={14}
              height={14}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
            <span className="alert-bar__spacer" />
            <button className="btn btn--ghost btn--sm" onClick={clearError}>
              Cerrar
            </button>
          </div>
        )}

        <div className="split split--2-1">
          {/* ── left col: list → form → success ── */}
          <div>
            {/* STEP 1: list */}
            {step === 1 && (
              <>
                <div className="s-head">
                  <span className="s-head__label">Órdenes esperadas</span>
                  <div className="s-head__rule" />
                  <span className="pill pill--teal s-head__action">
                    {filteredOrders.length} órdenes
                  </span>
                </div>

                <div className="f-group mb-16">
                  <label className="f-label" htmlFor="rec-search">
                    Buscar por nombre, SKU, factura o proveedor
                  </label>
                  <div style={{ position: "relative" }}>
                    <svg
                      style={{
                        position: "absolute",
                        left: 11,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 14,
                        height: 14,
                        stroke: "var(--teal-600)",
                        strokeWidth: 1.8,
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      id="rec-search"
                      className="f-input"
                      style={{ paddingLeft: 34 }}
                      placeholder="Nombre, SKU, proveedor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="mov-list">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="mov-item"
                        style={{ opacity: 0.4 }}
                      >
                        <span
                          className="mov-pip"
                          style={{ background: "var(--ink-12)" }}
                        />
                        <div
                          style={{
                            background: "var(--ink-06)",
                            borderRadius: 4,
                            height: 36,
                            flex: 1,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-40)",
                      padding: "20px 0",
                    }}
                  >
                    No hay órdenes pendientes.
                  </p>
                ) : (
                  <div className="table-surface">
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>OC / Proveedor</th>
                            <th>Producto</th>
                            <th>Pendiente</th>
                            <th>Estado</th>
                            <th>
                              <span className="sr-only">Acción</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.flatMap((order) =>
                            order.items
                              .filter((i) => i.quantity_pending > 0)
                              .map((item) => (
                                <tr key={`${order.id}-${item.id}`}>
                                  <td>
                                    <p className="prod-name">{order.number}</p>
                                    <p className="prod-sub">
                                      {order.supplier_nombre}
                                    </p>
                                  </td>
                                  <td>
                                    <span className="sku">
                                      {item.product_sku}
                                    </span>
                                    <p className="prod-sub">
                                      {item.product_name}
                                    </p>
                                  </td>
                                  <td className="text-mono">
                                    {item.quantity_received}/
                                    {item.quantity_ordered}
                                  </td>
                                  <td>{statusPill(order.status)}</td>
                                  <td>
                                    <button
                                      className="btn btn--primary btn--sm"
                                      onClick={() => selectItem(order, item)}
                                    >
                                      Seleccionar
                                    </button>
                                  </td>
                                </tr>
                              )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: form */}
            {step === 2 && (
              <>
                <div className="s-head">
                  <span className="s-head__label">Producto identificado</span>
                  <div className="s-head__rule" />
                  <span className="pill pill--ok s-head__action">Resuelto</span>
                </div>

                <div className="val-strip val-strip--ok mb-16">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    width={15}
                    height={15}
                    strokeWidth={2}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Código resuelto —{" "}
                  <strong className="text-mono" style={{ marginLeft: 6 }}>
                    {form.productSku} · {form.productName}
                  </strong>
                </div>

                {hasDiscrepancy && (
                  <div className="notice notice--warn mb-16">
                    <span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                      </svg>
                    </span>
                    <div>
                      <p className="notice__title">
                        Cantidad difiere de la facturada
                      </p>
                      <p className="notice__body">
                        Registra una nota de discrepancia. BR-09.
                      </p>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="alert-bar alert-bar--err mb-16" role="alert">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      width={14}
                      height={14}
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {formError}
                  </div>
                )}

                <form noValidate>
                  <div className="form-surface">
                    <fieldset>
                      <legend>Cantidades</legend>
                      <div className="f-row f-row-2 mb-16">
                        <div className="f-group">
                          <label className="f-label">Cantidad facturada</label>
                          <input
                            className="f-input text-mono"
                            type="number"
                            value={form.ordered}
                            readOnly
                            style={{
                              background: "var(--canvas)",
                              cursor: "default",
                            }}
                          />
                        </div>
                        <div className="f-group">
                          <label
                            className="f-label"
                            htmlFor="rec-qty"
                            style={
                              hasDiscrepancy
                                ? { color: "var(--warn)" }
                                : undefined
                            }
                          >
                            Cantidad recibida {hasDiscrepancy ? "⚠" : "✓"}
                          </label>
                          <input
                            id="rec-qty"
                            className="f-input text-mono"
                            type="number"
                            min={1}
                            value={form.received}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                received: Number(e.target.value),
                              })
                            }
                            style={
                              hasDiscrepancy
                                ? { borderColor: "var(--warn)" }
                                : undefined
                            }
                          />
                        </div>
                        {hasDiscrepancy && (
                          <div className="f-group f-group--full">
                            <label
                              className="f-label"
                              htmlFor="rec-disc-note"
                              style={{ color: "var(--warn)" }}
                            >
                              Nota de discrepancia — BR-09 *
                            </label>
                            <input
                              id="rec-disc-note"
                              className="f-input"
                              placeholder="Ej: 2 unidades faltantes en caja 3"
                              value={form.discrepancyNote}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  discrepancyNote: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend>Lote y vencimiento</legend>
                      <div className="f-row f-row-2 mb-16">
                        <div className="f-group">
                          <label className="f-label" htmlFor="rec-lot">
                            Código de lote
                          </label>
                          <input
                            id="rec-lot"
                            className="f-input text-mono"
                            placeholder="Ej: LOT-2026-01"
                            value={form.lotCode}
                            onChange={(e) =>
                              setForm({ ...form, lotCode: e.target.value })
                            }
                          />
                        </div>
                        <div className="f-group">
                          <label className="f-label" htmlFor="rec-exp">
                            Fecha de vencimiento
                          </label>
                          <input
                            id="rec-exp"
                            className="f-input"
                            type="date"
                            value={form.expirationDate}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                expirationDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend>Ubicación destino</legend>
                      <div className="f-group mb-16">
                        <label
                          className="f-label"
                          htmlFor="rec-loc"
                          style={{
                            color: !form.locationId ? "var(--err)" : undefined,
                          }}
                        >
                          Ubicación *
                        </label>
                        <input
                          id="rec-loc"
                          className="f-input"
                          placeholder="UUID de la ubicación destino"
                          value={form.locationId}
                          onChange={(e) =>
                            setForm({ ...form, locationId: e.target.value })
                          }
                        />
                        <p className="f-note">
                          Introduce el ID de la ubicación o conecta el selector
                          de ubicaciones.
                        </p>
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend>Reconocimientos</legend>
                      <div className="flex gap-20">
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.coldChainAck}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                coldChainAck: e.target.checked,
                              })
                            }
                          />
                          Cadena de frío confirmada
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.electricalSafetyAck}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                electricalSafetyAck: e.target.checked,
                              })
                            }
                          />
                          Seguridad eléctrica revisada (BR-04)
                        </label>
                      </div>
                    </fieldset>

                    <div className="form-footer">
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={clearSelection}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={handleConfirm}
                        disabled={saving}
                      >
                        {saving ? "Guardando..." : "Confirmar entrada"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3: success */}
            {step === 3 && (
              <>
                <div
                  className="val-strip val-strip--ok mb-24"
                  style={{ padding: "16px 20px", borderRadius: 12 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    width={20}
                    height={20}
                    strokeWidth={2}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 14 }}>{successMsg}</span>
                </div>
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    clearSelection();
                    fetchPendingOrders();
                  }}
                >
                  Registrar otra entrada
                </button>
              </>
            )}
          </div>

          {/* ── right col: recent movements ── */}
          <aside>
            <div className="s-head">
              <span className="s-head__label">Entradas recientes</span>
              <div className="s-head__rule" />
            </div>
            <p
              style={{ fontSize: 12, color: "var(--ink-40)", marginBottom: 14 }}
            >
              Movimientos de entrada del día actual.
            </p>
            <div className="notice notice--info">
              <span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                </svg>
              </span>
              <div>
                <p className="notice__title">BR-09: Discrepancia</p>
                <p className="notice__body">
                  Si la cantidad recibida difiere de la facturada, el sistema
                  obliga a registrar una nota explicativa antes de confirmar.
                </p>
              </div>
            </div>

            <div className="c-divider" />

            <div className="notice notice--warn">
              <span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                </svg>
              </span>
              <div>
                <p className="notice__title">BR-04: Serie obligatoria</p>
                <p className="notice__body">
                  Electroterapia requiere número de serie por unidad. Verifica
                  con el almacenista si el producto lo requiere.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
