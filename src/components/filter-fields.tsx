"use client";
import { useState } from "react";
import { CATEGORIES } from "@/contract/artForms";
import type { Form } from "@/contract/schemas";
export function FilterFields({
  all,
  lang,
  initialCategory = "",
  initialForm = "",
}: {
  all: Form[];
  lang: "en" | "hi";
  initialCategory?: string;
  initialForm?: string;
}) {
  const [category, setCategory] = useState(
      initialCategory || all.find((f) => f.id === initialForm)?.category || "",
    ),
    [form, setForm] = useState(initialForm);
  const hi = lang === "hi";
  return (
    <>
      <label>
        {hi ? "कला श्रेणी" : "Art category"}
        <select
          name="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setForm("");
          }}
        >
          <option value="">{hi ? "सभी श्रेणियाँ" : "All categories"}</option>
          {Object.entries(CATEGORIES).map(([id, name]) => (
            <option value={id} key={id}>
              {name[lang]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {hi ? "कला विधा" : "Art form"}
        <select
          name="form"
          disabled={!category}
          value={form}
          onChange={(e) => setForm(e.target.value)}
        >
          <option value="">
            {category
              ? hi
                ? "सभी विधाएँ"
                : "All forms"
              : hi
                ? "पहले कला श्रेणी चुनें"
                : "Select a category first"}
          </option>
          {all
            .filter((f) => f.category === category)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {hi ? f.hi : f.name}
              </option>
            ))}
        </select>
      </label>
    </>
  );
}
