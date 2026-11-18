"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ImageAsset, MenuItem } from "@/lib/flash/types";
import { activeDiscountPercent, discountOn } from "@/lib/flash/pricing";

/**
 * The food cart.
 *
 * The cart is the one piece of state that outlives a screen, so it lives in a
 * provider and survives a reload through localStorage. When the backend lands
 * this is the seam that becomes a server-side basket — the interface stays the
 * same.
 */

/** The kitchen the cart belongs to. */
export interface CartRestaurant {
  id: string;
  name: string;
  /** The base delivery charge — the quote adds the distance on top. */
  deliveryFee: number;
  distanceKm: number;
  etaMinutes: number;
  neighbourhood: string;
}

/** A dish as it was configured: this portion, these extras. */
export interface CartOptions {
  sizeId?: string;
  toppingIds?: string[];
}

export interface CartLine {
  /** The line's own key: the dish, its portion and its extras. */
  lineId: string;
  menuItemId: string;
  name: string;
  /** The unit price before this dish's discount. */
  listPrice: number;
  /** The unit price after this dish's discount. */
  price: number;
  /** The discount applied to this dish when it was added. */
  discountPercent: number;
  quantity: number;
  /** The kitchen this dish comes from. */
  restaurant: CartRestaurant;
  /** The portion chosen. */
  size: string;
  /** The extras chosen. */
  toppings: string[];
  image: ImageAsset;
}

interface CartValue {
  lines: CartLine[];
  /** The kitchen the cart currently belongs to, or null when it is mixed. */
  restaurant: CartRestaurant | null;
  restaurantId: string | null;
  restaurantName: string | null;
  count: number;
  /** The food, before the kitchen's discount. */
  subtotal: number;
  /** What the kitchen takes off. */
  discount: number;
  add: (item: MenuItem, restaurant: CartRestaurant, options?: CartOptions) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

const STORAGE_KEY = "flash-cart-v4";

/** What a configured dish costs: the portion, plus the extras. */
export function configuredPrice(item: MenuItem, options?: CartOptions): number {
  const size = item.sizes.find((entry) => entry.id === options?.sizeId) ?? item.sizes[0];
  const toppings = (options?.toppingIds ?? [])
    .map((id) => item.toppings.find((topping) => topping.id === id))
    .filter((topping): topping is MenuItem["toppings"][number] => Boolean(topping));

  return (size?.price ?? item.price) + toppings.reduce((total, topping) => total + topping.price, 0);
}

/** The line a configured dish becomes. */
function lineIdFor(item: MenuItem, options?: CartOptions): string {
  return [item.id, options?.sizeId ?? item.sizes[0]?.id, ...(options?.toppingIds ?? [])].join(":");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Restore the saved cart once, after the first paint — reading storage during
  // render would make the server and client markup disagree.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setLines(JSON.parse(stored) as CartLine[]);
      } catch {
        // A blocked or corrupt store just means an empty cart.
      }
      setReady(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Nothing to do: the cart stays in memory for this session.
    }
  }, [lines, ready]);

  const add = useCallback(
    (item: MenuItem, restaurant: CartRestaurant, options?: CartOptions) => {
      const lineId = lineIdFor(item, options);
      const size =
        item.sizes.find((entry) => entry.id === options?.sizeId) ?? item.sizes[0];
      const toppings = (options?.toppingIds ?? [])
        .map((id) => item.toppings.find((topping) => topping.id === id))
        .filter((topping): topping is MenuItem["toppings"][number] => Boolean(topping));

      const listPrice = configuredPrice(item, options);
      const discountPercent = activeDiscountPercent(item);
      const price = listPrice - discountOn(listPrice, discountPercent);

      setLines((current) => {
        const existing = current.find((line) => line.lineId === lineId);

        if (existing) {
          return current.map((line) =>
            line.lineId === lineId
              ? { ...line, quantity: Math.min(20, line.quantity + 1) }
              : line,
          );
        }

        return [
          ...current,
          {
            lineId,
            menuItemId: item.id,
            name: item.name,
            listPrice,
            price,
            discountPercent,
            quantity: 1,
            restaurant,
            size: size?.name ?? "",
            toppings: toppings.map((topping) => topping.name),
            image: item.image,
          },
        ];
      });
    },
    [],
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.lineId !== lineId)
        : current.map((line) =>
            line.lineId === lineId ? { ...line, quantity: Math.min(20, quantity) } : line,
          ),
    );
  }, []);

  const remove = useCallback((lineId: string) => {
    setLines((current) => current.filter((line) => line.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const first = lines[0];
    const mixed = lines.some((line) => line.restaurant.id !== first?.restaurant.id);
    const restaurant = mixed || !first ? null : first.restaurant;
    const subtotal = lines.reduce((total, line) => total + line.listPrice * line.quantity, 0);
    const discount = lines.reduce(
      (total, line) => total + discountOn(line.listPrice, line.discountPercent) * line.quantity,
      0,
    );

    return {
      lines,
      restaurant,
      restaurantId: restaurant?.id ?? null,
      restaurantName: restaurant?.name ?? null,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal,
      discount,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [add, clear, lines, remove, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
