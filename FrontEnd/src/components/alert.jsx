import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Alert({ type = "info", message }) {
  const baseStyles = "flex items-start gap-2.5 rounded-md border p-3 text-sm";
  const variants = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    info: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 9h2v6H9V9zM9 5h2v2H9V5z" /></svg>,
  };

  return (
    <div className={`${baseStyles} ${variants[type]}`}>
      {icons[type]}
      <span className="leading-5">{message}</span>
    </div>
  );
}
