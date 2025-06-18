import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Alert({ type = "info", message }) {
  const baseStyles = "flex items-center gap-2 p-3 rounded-md text-sm mb-4";
  const variants = {
    success: "bg-green-50 text-green-700 border border-green-400",
    error: "bg-red-50 text-red-700 border border-red-400",
    warning: "bg-yellow-50 text-yellow-700 border border-yellow-400",
    info: "bg-blue-50 text-blue-700 border border-blue-400",
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
      <span>{message}</span>
    </div>
  );
}
