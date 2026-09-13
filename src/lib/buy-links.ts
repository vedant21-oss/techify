export interface BuyLink {
  store: "Amazon" | "Flipkart";
  url: string;
}

/** Marketplace search links for the exact model. */
export function buyLinks(device: { brand: string; name: string; searchQuery: string | null }): BuyLink[] {
  const query = device.searchQuery ?? searchText(device.brand, device.name);
  const q = encodeURIComponent(query);
  return [
    { store: "Amazon", url: `https://www.amazon.in/s?k=${q}` },
    { store: "Flipkart", url: `https://www.flipkart.com/search?q=${q}` },
  ];
}

function searchText(brand: string, name: string): string {
  // Avoid "Apple Apple …" or "Xiaomi Redmi …" style duplication when the name already carries a brand.
  return name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
}
