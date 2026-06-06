"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import type { Phone } from "@/types";
import Loader from "@/components/Loader";

interface PhonesPage {
  data: { data: Phone[]; total: number; page: number; limit: number };
}

type ModalMode = "add" | "edit" | null;

const EMPTY_FORM = {
  name: "",
  brand: "",
  slug: "",
  image: "",
  // price
  "price.original": "",
  "price.current": "",
  "price.currency": "INR",
  "price.discount": "0",
  // specs — basic
  "specs.ram": "",
  "specs.storage": "",
  "specs.processor": "",
  "specs.processorSpeed": "",
  "specs.os": "",
  "specs.ui": "",
  // display
  "specs.display.size": "",
  "specs.display.type": "",
  "specs.display.resolution": "",
  "specs.display.refreshRate": "",
  "specs.display.brightness": "",
  // camera
  "specs.camera.rear.main": "",
  "specs.camera.rear.ultrawide": "",
  "specs.camera.rear.macro": "",
  "specs.camera.front": "",
  // battery
  "specs.battery.capacity": "",
  "specs.battery.charging": "",
  "specs.battery.wireless": "false",
  // connectivity
  "specs.connectivity.network": "5G",
  "specs.connectivity.wifi": "",
  "specs.connectivity.bluetooth": "",
  "specs.connectivity.nfc": "true",
  "specs.connectivity.usb": "",
  // meta
  tags: "",
  rating: "",
  reviewCount: "",
  availability: "available",
};

type FormState = typeof EMPTY_FORM;

function formToPhone(f: FormState) {
  return {
    name: f.name,
    brand: f.brand,
    slug: f.slug || f.name.toLowerCase().replace(/\s+/g, "-"),
    image: f.image,
    price: {
      original: Number(f["price.original"]),
      current: Number(f["price.current"]),
      currency: f["price.currency"],
      discount: Number(f["price.discount"]),
    },
    specs: {
      ram: Number(f["specs.ram"]),
      storage: Number(f["specs.storage"]),
      processor: f["specs.processor"],
      processorSpeed: Number(f["specs.processorSpeed"]),
      os: f["specs.os"],
      ui: f["specs.ui"],
      display: {
        size: Number(f["specs.display.size"]),
        type: f["specs.display.type"],
        resolution: f["specs.display.resolution"],
        refreshRate: Number(f["specs.display.refreshRate"]),
        brightness: Number(f["specs.display.brightness"]),
      },
      camera: {
        rear: {
          main: Number(f["specs.camera.rear.main"]),
          ultrawide: Number(f["specs.camera.rear.ultrawide"]),
          macro: Number(f["specs.camera.rear.macro"]),
        },
        front: Number(f["specs.camera.front"]),
      },
      battery: {
        capacity: Number(f["specs.battery.capacity"]),
        charging: Number(f["specs.battery.charging"]),
        wireless: f["specs.battery.wireless"] === "true",
      },
      connectivity: {
        network: f["specs.connectivity.network"],
        wifi: f["specs.connectivity.wifi"],
        bluetooth: f["specs.connectivity.bluetooth"],
        nfc: f["specs.connectivity.nfc"] === "true",
        usb: f["specs.connectivity.usb"],
      },
    },
    tags: f.tags ? f.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    rating: f.rating ? Number(f.rating) : undefined,
    reviewCount: f.reviewCount ? Number(f.reviewCount) : undefined,
    availability: f.availability,
  };
}

function phoneToForm(p: Phone): FormState {
  return {
    name: p.name,
    brand: p.brand,
    slug: p.slug,
    image: p.image || "",
    "price.original": String(p.price?.original ?? ""),
    "price.current": String(p.price?.current ?? ""),
    "price.currency": p.price?.currency ?? "INR",
    "price.discount": String(p.price?.discount ?? 0),
    "specs.ram": String(p.specs?.ram ?? ""),
    "specs.storage": String(p.specs?.storage ?? ""),
    "specs.processor": p.specs?.processor ?? "",
    "specs.processorSpeed": String((p.specs as any)?.processorSpeed ?? ""),
    "specs.os": p.specs?.os ?? "",
    "specs.ui": (p.specs as any)?.ui ?? "",
    "specs.display.size": String(p.specs?.display?.size ?? ""),
    "specs.display.type": p.specs?.display?.type ?? "",
    "specs.display.resolution": (p.specs?.display as any)?.resolution ?? "",
    "specs.display.refreshRate": String(p.specs?.display?.refreshRate ?? ""),
    "specs.display.brightness": String((p.specs?.display as any)?.brightness ?? ""),
    "specs.camera.rear.main": String(p.specs?.camera?.rear?.main ?? ""),
    "specs.camera.rear.ultrawide": String((p.specs?.camera?.rear as any)?.ultrawide ?? ""),
    "specs.camera.rear.macro": String((p.specs?.camera?.rear as any)?.macro ?? ""),
    "specs.camera.front": String(p.specs?.camera?.front ?? ""),
    "specs.battery.capacity": String((p.specs?.battery as any)?.capacity ?? ""),
    "specs.battery.charging": String((p.specs?.battery as any)?.charging ?? ""),
    "specs.battery.wireless": String((p.specs?.battery as any)?.wireless ?? "false"),
    "specs.connectivity.network": p.specs?.connectivity?.network ?? "5G",
    "specs.connectivity.wifi": (p.specs?.connectivity as any)?.wifi ?? "",
    "specs.connectivity.bluetooth": (p.specs?.connectivity as any)?.bluetooth ?? "",
    "specs.connectivity.nfc": String(p.specs?.connectivity?.nfc ?? "true"),
    "specs.connectivity.usb": (p.specs?.connectivity as any)?.usb ?? "",
    tags: Array.isArray((p as any).tags) ? (p as any).tags.join(", ") : "",
    rating: String((p as any).rating ?? ""),
    reviewCount: String((p as any).reviewCount ?? ""),
    availability: p.availability ?? "available",
  };
}

function Field({
  label,
  fieldKey,
  form,
  setForm,
  type = "text",
  span2 = false,
}: {
  label: string;
  fieldKey: keyof FormState;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  type?: string;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[fieldKey]}
        onChange={(e) => setForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function Select({
  label,
  fieldKey,
  form,
  setForm,
  options,
}: {
  label: string;
  fieldKey: keyof FormState;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={form[fieldKey]}
        onChange={(e) => setForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-3 mb-1 border-b border-gray-700 pb-1">
      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{children}</span>
    </div>
  );
}

export default function AdminPhonesPage() {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = (await adminApi.getAllPhones(page, limit)) as PhonesPage;
      const { data: phones, total } = res.data;
      setPhones(phones);
      setTotal(total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load phones");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingPhone(null);
    setModalMode("add");
  }

  function openEdit(phone: Phone) {
    setForm(phoneToForm(phone));
    setEditingPhone(phone);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingPhone(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = formToPhone(form);
      if (modalMode === "add") {
        await adminApi.createPhone(payload as Record<string, unknown>);
      } else if (editingPhone) {
        await adminApi.updatePhone(editingPhone._id, payload as Record<string, unknown>);
      }
      closeModal();
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminApi.deletePhone(id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Phones</h1>
          <p className="text-gray-500 text-sm">{total} total</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Phone
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">RAM</th>
                  <th className="px-4 py-3">Network</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {phones.map((phone) => (
                  <tr key={phone._id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{phone.name}</td>
                    <td className="px-4 py-3 text-gray-400">{phone.brand}</td>
                    <td className="px-4 py-3 text-gray-300">₹{phone.price?.current?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{phone.specs?.ram}GB</td>
                    <td className="px-4 py-3 text-gray-400">{phone.specs?.connectivity?.network}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        phone.availability === "available"
                          ? "bg-green-900/40 text-green-400"
                          : "bg-gray-800 text-gray-500"
                      }`}>
                        {phone.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(phone)} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">Edit</button>
                      <button onClick={() => setDeleteConfirm(phone._id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3 mt-4 text-sm text-gray-400">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40 hover:text-white transition-colors">← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40 hover:text-white transition-colors">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 custom-scrollbar">
            <h2 className="text-white font-bold text-lg mb-5">
              {modalMode === "add" ? "Add Phone" : "Edit Phone"}
            </h2>

            <div className="grid grid-cols-2 gap-3">

              {/* Basic */}
              <SectionLabel>Basic Info</SectionLabel>
              <Field label="Name" fieldKey="name" form={form} setForm={setForm} span2 />
              <Field label="Brand" fieldKey="brand" form={form} setForm={setForm} />
              <Field label="Slug (auto if blank)" fieldKey="slug" form={form} setForm={setForm} />
              <Field label="Image URL" fieldKey="image" form={form} setForm={setForm} span2 />

              {/* Price */}
              <SectionLabel>Price</SectionLabel>
              <Field label="Original Price (₹)" fieldKey="price.original" form={form} setForm={setForm} type="number" />
              <Field label="Current Price (₹)" fieldKey="price.current" form={form} setForm={setForm} type="number" />
              <Field label="Discount %" fieldKey="price.discount" form={form} setForm={setForm} type="number" />
              <Select label="Currency" fieldKey="price.currency" form={form} setForm={setForm}
                options={[{ value: "INR", label: "INR" }, { value: "USD", label: "USD" }]} />

              {/* Core Specs */}
              <SectionLabel>Core Specs</SectionLabel>
              <Field label="RAM (GB)" fieldKey="specs.ram" form={form} setForm={setForm} type="number" />
              <Field label="Storage (GB)" fieldKey="specs.storage" form={form} setForm={setForm} type="number" />
              <Field label="Processor" fieldKey="specs.processor" form={form} setForm={setForm} span2 />
              <Field label="Processor Speed (GHz)" fieldKey="specs.processorSpeed" form={form} setForm={setForm} type="number" />
              <Field label="OS" fieldKey="specs.os" form={form} setForm={setForm} />
              <Field label="UI Skin" fieldKey="specs.ui" form={form} setForm={setForm} span2 />

              {/* Display */}
              <SectionLabel>Display</SectionLabel>
              <Field label="Size (inches)" fieldKey="specs.display.size" form={form} setForm={setForm} type="number" />
              <Field label="Type" fieldKey="specs.display.type" form={form} setForm={setForm} />
              <Field label="Resolution" fieldKey="specs.display.resolution" form={form} setForm={setForm} />
              <Field label="Refresh Rate (Hz)" fieldKey="specs.display.refreshRate" form={form} setForm={setForm} type="number" />
              <Field label="Brightness (nits)" fieldKey="specs.display.brightness" form={form} setForm={setForm} type="number" />

              {/* Camera */}
              <SectionLabel>Camera</SectionLabel>
              <Field label="Rear Main (MP)" fieldKey="specs.camera.rear.main" form={form} setForm={setForm} type="number" />
              <Field label="Rear Ultrawide (MP)" fieldKey="specs.camera.rear.ultrawide" form={form} setForm={setForm} type="number" />
              <Field label="Rear Macro (MP)" fieldKey="specs.camera.rear.macro" form={form} setForm={setForm} type="number" />
              <Field label="Front (MP)" fieldKey="specs.camera.front" form={form} setForm={setForm} type="number" />

              {/* Battery */}
              <SectionLabel>Battery</SectionLabel>
              <Field label="Capacity (mAh)" fieldKey="specs.battery.capacity" form={form} setForm={setForm} type="number" />
              <Field label="Charging (W)" fieldKey="specs.battery.charging" form={form} setForm={setForm} type="number" />
              <Select label="Wireless Charging" fieldKey="specs.battery.wireless" form={form} setForm={setForm}
                options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />

              {/* Connectivity */}
              <SectionLabel>Connectivity</SectionLabel>
              <Select label="Network" fieldKey="specs.connectivity.network" form={form} setForm={setForm}
                options={[{ value: "5G", label: "5G" }, { value: "4G", label: "4G" }, { value: "3G", label: "3G" }]} />
              <Field label="Wi-Fi" fieldKey="specs.connectivity.wifi" form={form} setForm={setForm} />
              <Field label="Bluetooth" fieldKey="specs.connectivity.bluetooth" form={form} setForm={setForm} />
              <Select label="NFC" fieldKey="specs.connectivity.nfc" form={form} setForm={setForm}
                options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />
              <Field label="USB" fieldKey="specs.connectivity.usb" form={form} setForm={setForm} />

              {/* Meta */}
              <SectionLabel>Meta</SectionLabel>
              <Field label="Tags (comma separated)" fieldKey="tags" form={form} setForm={setForm} span2 />
              <Field label="Rating (0–5)" fieldKey="rating" form={form} setForm={setForm} type="number" />
              <Field label="Review Count" fieldKey="reviewCount" form={form} setForm={setForm} type="number" />
              <Select label="Availability" fieldKey="availability" form={form} setForm={setForm}
                options={[{ value: "available", label: "Available" }, { value: "unavailable", label: "Unavailable" }]} />

            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white mb-1 font-semibold">Delete this phone?</p>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
