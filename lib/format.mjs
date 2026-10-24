// Shared by server pages and client components (must not live in a "use client" file).
export const formatDate = (iso, lang = "en") => new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
