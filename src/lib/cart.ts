export type CartItem = {
  productId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  city: string;
  vendorBusinessName?: string | null;
  stockQuantity: number;
  quantity: number;
};

const CART_KEY_PREFIX = "locallink-cart";
export const GUEST_CART_OWNER = "guest";
export const CART_CHANGED_EVENT = "locallink-cart-changed";

export function getCartOwnerKey(user?: { id?: string; email?: string } | null) {
  return user?.id ?? user?.email ?? GUEST_CART_OWNER;
}

function getCartStorageKey(ownerKey: string) {
  return `${CART_KEY_PREFIX}:${ownerKey}`;
}

function readStorage(ownerKey: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getCartStorageKey(ownerKey));
}

function writeStorage(ownerKey: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCartStorageKey(ownerKey), JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function getCartItems(ownerKey = GUEST_CART_OWNER) {
  const value = readStorage(ownerKey);
  if (!value) return [];

  try {
    const items = JSON.parse(value) as CartItem[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveCartItems(ownerKey: string, items: CartItem[]) {
  writeStorage(ownerKey, items.filter((item) => item.quantity > 0));
}

export function clearCartItems(ownerKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getCartStorageKey(ownerKey));
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function addCartItem(ownerKey: string, item: CartItem) {
  const items = getCartItems(ownerKey);
  const existing = items.find((cartItem) => cartItem.productId === item.productId);

  if (!existing) {
    saveCartItems(ownerKey, [...items, item]);
    return;
  }

  const nextQuantity = Math.min(existing.quantity + item.quantity, item.stockQuantity);
  saveCartItems(
    ownerKey,
    items.map((cartItem) =>
      cartItem.productId === item.productId
        ? { ...cartItem, ...item, quantity: nextQuantity }
        : cartItem
    )
  );
}

export function updateCartItemQuantity(ownerKey: string, productId: string, quantity: number) {
  saveCartItems(
    ownerKey,
    getCartItems(ownerKey).map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(Math.max(quantity, 1), item.stockQuantity) }
        : item
    )
  );
}

export function removeCartItem(ownerKey: string, productId: string) {
  saveCartItems(ownerKey, getCartItems(ownerKey).filter((item) => item.productId !== productId));
}

export function getCartCount(items: CartItem[] = []) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartTotal(items: CartItem[] = []) {
  return items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}
