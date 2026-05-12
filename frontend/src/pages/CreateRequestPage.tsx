import { FormEvent, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../api/client";
import BackButton from "../components/BackButton";
import { getErrorMessage } from "../utils/format";

const initialForm = {
  title: "",
  requesterName: "",
  componentName: "",
  componentType: "",
  targetSerial: "",
  priority: "MEDIUM",
  description: "",
};

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const requiredFields: Array<keyof typeof form> = [
      "title",
      "requesterName",
      "componentName",
      "componentType",
      "targetSerial",
    ];
    const missingField = requiredFields.find((field) => !form[field].trim());

    if (missingField) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.post<{ id: number }>("/test-requests", {
        ...form,
        description: form.description || null,
      });
      navigate(`/requests/${response.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <BackButton fallback="/requests" />

      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Create Test Request
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit a hardware validation request for test team review.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-md border border-slate-200 bg-white p-5"
      >
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Requester Name" required>
            <input
              value={form.requesterName}
              onChange={(event) =>
                updateField("requesterName", event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Component Name" required>
            <input
              value={form.componentName}
              onChange={(event) =>
                updateField("componentName", event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Component Type" required>
            <input
              value={form.componentType}
              onChange={(event) =>
                updateField("componentType", event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Target Serial" required>
            <input
              value={form.targetSerial}
              onChange={(event) =>
                updateField("targetSerial", event.target.value)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Priority">
            <select
              value={form.priority}
              onChange={(event) => updateField("priority", event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Creating..." : "Create Request"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
