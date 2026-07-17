import { useState, useEffect } from "react";
import Modal from "./Modal";

/**
 * Payment confirmation modal for receptionist.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   paymentData: {
 *     patientId: number,
 *     patientName: string,
 *     patientNic: string,
 *     doctorId: number,
 *     doctorName: string,
 *     appointmentId: number,
 *     timeSlot: string
 *   } | null,
 *   onConfirm: (amount: number, method: string) => Promise<void>,
 *   isSubmitting: boolean
 * }} props
 */
function PaymentModal({ isOpen, onClose, paymentData, onConfirm, isSubmitting }) {
  const [amount, setAmount] = useState(1000);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Reset to defaults when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setAmount(1000);
      setPaymentMethod("cash");
    }
  }, [isOpen, paymentData]);

  if (!isOpen || !paymentData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0) return;
    await onConfirm(amount, paymentMethod);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Payment & Check-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Doctor info card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3.5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
              <span className="block font-bold text-slate-800 text-sm mt-0.5">{paymentData.patientName}</span>
              <span className="block text-xs text-slate-500 font-semibold mt-0.5">NIC: {paymentData.patientNic || "N/A"}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consultation</span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1A73E8] px-2 py-0.5 rounded-lg text-[10px] font-bold mt-1">
                <i className="ti ti-clock text-[10px]" />
                {paymentData.timeSlot}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</span>
            <span className="block font-bold text-slate-800 text-sm mt-0.5">
              <i className="ti ti-user-doctor text-slate-400 mr-1.5" />
              {paymentData.doctorName}
            </span>
          </div>
        </div>

        {/* Input fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Consultation Fee (LKR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                LKR
              </span>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="1000.00"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Cash Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  paymentMethod === "cash"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500"
                }`}
              >
                <i className="ti ti-cash text-2xl mb-1" />
                <span className="text-xs font-bold">Cash</span>
              </button>

              {/* Card Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  paymentMethod === "card"
                    ? "border-purple-500 bg-purple-50/50 text-purple-700"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500"
                }`}
              >
                <i className="ti ti-credit-card text-2xl mb-1" />
                <span className="text-xs font-bold">Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <i className="ti ti-circle-check" />
                Confirm Paid
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PaymentModal;
