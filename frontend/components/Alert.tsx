// components/Alert.tsx
interface Props {
  type: "info" | "success" | "warning" | "error";
  message: string;
}

const styles = {
  info:    "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error:   "border-red-200 bg-red-50 text-red-800",
};

const bar = {
  info:    "bg-blue-400",
  success: "bg-green-500",
  warning: "bg-amber-400",
  error:   "bg-red-500",
};

export default function Alert({ type, message }: Props) {
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      <span className={`mt-0.5 w-1 shrink-0 rounded-full self-stretch ${bar[type]}`} />
      <span>{message}</span>
    </div>
  );
}

