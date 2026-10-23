// Shared by server pages and client components (must not live in a "use client" file).
export const formatDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
