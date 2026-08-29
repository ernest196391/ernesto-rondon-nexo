export type StorefrontCategory = {
  id: string;
  label: string;
  slug: string;
  icon: "appliances" | "cooking" | "bedroom" | "energy" | "technology" | "other";
  order: number;
  enabled: boolean;
  sourceCategoryIds: number[];
  sourceSlugs: string[];
};

export const STOREFRONT_CATEGORIES: StorefrontCategory[] = [
  { id: "electrodomesticos", label: "Electrodomésticos", slug: "electrodomesticos", icon: "appliances", order: 10, enabled: true, sourceCategoryIds: [], sourceSlugs: ["aires acondicionados", "refrigeradores", "lavadoras", "licuadoras", "ventiladores", "electrodomesticos"] },
  { id: "cocina", label: "Cocina", slug: "cocina", icon: "cooking", order: 20, enabled: true, sourceCategoryIds: [], sourceSlugs: ["cocinas y hornos", "arroceras", "ollas", "cocina"] },
  { id: "habitacion", label: "Habitación", slug: "habitacion", icon: "bedroom", order: 30, enabled: true, sourceCategoryIds: [], sourceSlugs: ["colchones", "habitacion", "dormitorio"] },
  { id: "energia", label: "Energía", slug: "energia", icon: "energy", order: 40, enabled: true, sourceCategoryIds: [], sourceSlugs: ["energia solar", "paneles solares", "energia"] },
  { id: "tecnologia", label: "Tecnología", slug: "tecnologia", icon: "technology", order: 50, enabled: true, sourceCategoryIds: [], sourceSlugs: ["television digital", "televisores", "decodificadores", "celulares", "tabletas", "computadoras", "audio", "accesorios electronicos", "dispositivos inteligentes", "tecnologia"] },
  { id: "otros", label: "Otros", slug: "otros", icon: "other", order: 60, enabled: true, sourceCategoryIds: [], sourceSlugs: ["motos", "otros"] },
];

export function normalizedCategory(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es");
}

export function familyForProduct(product: { categories: Array<{ id: number; name: string }> }) {
  const categories = product.categories.map((category) => ({ id: category.id, slug: normalizedCategory(category.name) }));
  return STOREFRONT_CATEGORIES.filter((family) => family.enabled).sort((a, b) => a.order - b.order).find((family) =>
    categories.some((category) => family.sourceCategoryIds.includes(category.id) || family.sourceSlugs.some((slug) => category.slug.includes(normalizedCategory(slug)))),
  ) || STOREFRONT_CATEGORIES.find((family) => family.id === "otros")!;
}
