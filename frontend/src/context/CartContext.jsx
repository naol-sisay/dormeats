import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext();

// Multi-vendor cart: items from any number of vendors can live in the cart
// at once. Each item remembers which vendor it belongs to so checkout can
// split into one order per vendor.
export const CartProvider = ({ children }) => {
  // { menuItemId, name, price, quantity, vendorId, vendorName }
  const [items, setItems] = useState([]);

  // `vendor` may be a vendor object ({ _id, name }) or a bare id (back-compat)
  const addItem = (vendor, item) => {
    const vendorId = typeof vendor === "object" ? vendor._id : vendor;
    const vendorName = typeof vendor === "object" ? vendor.name : undefined;

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          vendorId,
          vendorName,
        },
      ];
    });
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Group items by vendor -> [{ vendorId, vendorName, items, subtotal }]
  const itemsByVendor = useMemo(() => {
    const groups = {};
    for (const i of items) {
      const g = (groups[i.vendorId] ||= {
        vendorId: i.vendorId,
        vendorName: i.vendorName,
        items: [],
        subtotal: 0,
      });
      g.items.push(i);
      g.subtotal += i.price * i.quantity;
    }
    return Object.values(groups);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, itemsByVendor, addItem, removeItem, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
