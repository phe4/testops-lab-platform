import { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
    >
      ← Back
    </button>
  );
}
