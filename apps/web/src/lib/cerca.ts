// Per cercar en llistes sense distingir majúscules ni accents.

// Treu els accents i ho passa tot a minúscules
const normalitza = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Diu si el text conté el que s'ha escrit al cercador (si el cercador és buit, sempre)
export function coincideix(text: string, cerca: string): boolean {
  return normalitza(text).includes(normalitza(cerca.trim()));
}
