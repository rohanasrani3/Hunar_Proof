"use client";
import { useState } from "react";
import { CATEGORIES } from "@/contract/artForms";
import type { Form } from "@/contract/schemas";

export function CommissionFormFields({ all, lang }: { all: Form[]; lang: "en" | "hi" }) {
  const [category, setCategory] = useState("");
  const [form, setForm] = useState("");
  const hi = lang === "hi";
  return (
    <>
      <label>
        {hi ? "कला श्रेणी" : "Art category"}
        <select name="category" value={category} onChange={(e) => { setCategory(e.target.value); setForm(""); }} required>
          <option value="">{hi ? "श्रेणी चुनें" : "Choose a category"}</option>
          {Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label[lang]}</option>)}
        </select>
      </label>
      <label>
        {hi ? "विशिष्ट कला विधा" : "Specific art form"}
        <select name="form" value={form} onChange={(e) => setForm(e.target.value)} disabled={!category} required>
          <option value="">{hi ? "कला विधा चुनें" : "Choose an art form"}</option>
          {all.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{hi ? item.hi : item.name}</option>)}
          <option value="__other__">{hi ? "अन्य" : "Other"}</option>
        </select>
      </label>
      {form === "__other__" && (
        <label>
          {hi ? "कला विधा का नाम" : "Name the art form"}
          <input name="otherForm" maxLength={120} required />
        </label>
      )}
    </>
  );
}
