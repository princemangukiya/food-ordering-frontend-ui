const API_BASE_URL = "/api";

// Local storage fallback storage helpers
const LOCAL_ORDERS_KEY = "food_express_orders_store";

export const DEFAULT_REVIEWS = [
  {
    id: 101,
    customerName: "Rahul Sharma",
    customerPhone: "9876543210",
    rating: 5,
    comment: "Super Saver Burger Combo was crispy, hot, and delivered in just 20 minutes! Highly recommended.",
    orderId: "101",
    foodName: "Super Saver Burger Combo",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    customerName: "Pooja Patel",
    customerPhone: "9898777366",
    rating: 5,
    comment: "Loved the Oreo cream shake and burger combo! Super fresh and neatly packed with zero spills.",
    orderId: "2",
    foodName: "Oreo Cream Thick Shake",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 851189,
    customerName: "Vikas Sheikh",
    customerPhone: "9999999999",
    rating: 5,
    comment: "Crispy Falafel wrap was warm, crunchy, and authentic! Amazing delivery speed.",
    orderId: "851189",
    foodName: "Crispy Falafel & Hummus Wrap",
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: 104,
    customerName: "Ananya Deshmukh",
    customerPhone: "9812345678",
    rating: 5,
    comment: "Pizza Party Feast Combo was super cheesy and crust was soft. Complete value for money!",
    orderId: "104",
    foodName: "Pizza Party Feast Combo",
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 105,
    customerName: "Neha Gupta",
    customerPhone: "9811223344",
    rating: 5,
    comment: "Dum Biryani aroma was authentic Mughlai! Raita and salan were perfectly spiced.",
    orderId: "105",
    foodName: "Royal Dum Biryani Combo",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_DEMO_ORDERS = [
  {
    id: 101,
    customerName: "Rahul Sharma",
    customerPhone: "9876543210",
    customerEmail: "rahul.sharma@gmail.com",
    deliveryAddress: "Flat 402, Sunshine Heights, Sector 18, Noida",
    paymentMethod: "ONLINE",
    orderStatus: "PREPARING",
    totalAmount: 588.0,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    orderItems: [
      { foodId: 1, foodName: "Super Saver Burger Combo", foodPrice: 249.0, quantity: 2 },
      { foodId: 8, foodName: "Butter Naan Basket (3 Pcs)", foodPrice: 99.0, quantity: 1 },
    ],
  },
  {
    id: 2,
    customerName: "Pooja Patel",
    customerPhone: "9898777366",
    customerEmail: "pooja.patel@gmail.com",
    deliveryAddress: "Apartment 900, High Street Tower, City Center",
    paymentMethod: "ONLINE",
    orderStatus: "CONFIRMED",
    totalAmount: 398.0,
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    orderItems: [
      { foodId: 1, foodName: "Super Saver Burger Combo", foodPrice: 249.0, quantity: 1 },
      { foodId: 17, foodName: "Oreo Cream Thick Shake", foodPrice: 149.0, quantity: 1 },
    ],
  },
  {
    id: 851189,
    customerName: "Vikas Sheikh",
    customerPhone: "9999999999",
    customerEmail: "vikas.sheikh@gmail.com",
    deliveryAddress: "Flat 402, Sunshine Heights, Sector 18, Noida, Landmark: Bhavnagar",
    paymentMethod: "COD",
    orderStatus: "DELIVERED",
    totalAmount: 217.0,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    orderItems: [
      { foodId: 12, foodName: "Crispy Falafel & Hummus Wrap", foodPrice: 169.0, quantity: 1 },
    ],
  },
  {
    id: 104,
    customerName: "Ananya Deshmukh",
    customerPhone: "9812345678",
    customerEmail: "ananya.d@gmail.com",
    deliveryAddress: "Tower 4, Flat 1102, Cyber City Residency, Sector 62",
    paymentMethod: "ONLINE",
    orderStatus: "OUT_FOR_DELIVERY",
    totalAmount: 649.0,
    createdAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    orderItems: [
      { foodId: 2, foodName: "Pizza Party Feast Combo", foodPrice: 599.0, quantity: 1 },
    ],
  },
];

export function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error reading local orders:", e);
  }
  // Initialize with realistic orders if empty
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
  } catch {}
  return INITIAL_DEMO_ORDERS;
}

export function saveLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.warn("Error saving local orders:", e);
  }
}

export function attachReviewToOrder(orderId, review) {
  const localOrders = getLocalOrders();
  const updatedList = localOrders.map((o) => {
    if (String(o.id) === String(orderId)) {
      return { ...o, review };
    }
    return o;
  });
  saveLocalOrders(updatedList);
}

export const getFoods = async (category = "", search = "") => {
  try {
    let url = `${API_BASE_URL}/foods`;
    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (search && search.trim() !== "") params.append("search", search.trim());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch food items");
    return await res.json();
  } catch (err) {
    console.warn("Backend API unavailable, using in-memory dataset:", err.message);
    throw err;
  }
};

export const getFoodById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/foods/${id}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable for getFoodById:", e);
  }
  return null;
};

export const placeOrder = async (orderData) => {
  // Format items to match Spring Boot's OrderItem entity: foodId, foodName, foodPrice, quantity
  const formattedItems = (orderData.orderItems || orderData.items || []).map((it, idx) => ({
    foodId: Number(it.foodId || it.id || idx + 1),
    foodName: String(it.foodName || it.name || "Delicious Dish"),
    foodPrice: Number(it.foodPrice || it.price || 0),
    quantity: Number(it.quantity || 1),
  }));

  const payload = {
    customerName: orderData.customerName.trim(),
    customerPhone: orderData.customerPhone.trim(),
    customerEmail: orderData.customerEmail ? orderData.customerEmail.trim() : `${orderData.customerPhone.trim()}@foodexpress.in`,
    deliveryAddress: orderData.deliveryAddress.trim(),
    paymentMethod: orderData.paymentMethod || "COD",
    totalAmount: Number(orderData.totalAmount || 0),
    orderItems: formattedItems,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const serverOrder = await res.json();
      // Sync to local storage
      const current = getLocalOrders();
      saveLocalOrders([serverOrder, ...current.filter((o) => o.id !== serverOrder.id)]);
      localStorage.setItem("food_last_placed_order", JSON.stringify(serverOrder));
      localStorage.setItem("food_customer_phone", serverOrder.customerPhone);
      return serverOrder;
    } else {
      const errText = await res.text();
      console.warn("Spring Boot returned error on placeOrder:", res.status, errText);
    }
  } catch (err) {
    console.warn("Backend fetch failed, saving order locally:", err.message);
  }

  // Fallback offline order creation
  const localOrders = getLocalOrders();
  const newOrder = {
    id: Date.now() % 1000000,
    ...payload,
    orderStatus: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  saveLocalOrders([newOrder, ...localOrders]);
  localStorage.setItem("food_last_placed_order", JSON.stringify(newOrder));
  localStorage.setItem("food_customer_phone", newOrder.customerPhone);
  return newOrder;
};

export const getOrderById = async (orderId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }

  const localOrders = getLocalOrders();
  const found = localOrders.find((o) => String(o.id) === String(orderId));
  if (found) return found;
  throw new Error("Order not found");
};

export const getOrdersByPhone = async (phone) => {
  const rawPhone = String(phone || "").trim();
  const digits = rawPhone.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;

  let serverOrders = [];

  // 1. Try direct fetch with raw phone
  try {
    const res = await fetch(`${API_BASE_URL}/orders/user/${encodeURIComponent(rawPhone)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) serverOrders = data;
    }
  } catch (e) {
    // fallback
  }

  // 2. If empty and last10 differs from raw phone, try last10 digits
  if (serverOrders.length === 0 && last10 && last10 !== rawPhone) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/user/${encodeURIComponent(last10)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) serverOrders = data;
      }
    } catch (e) {
      // fallback
    }
  }

  // 3. If still empty, check all server orders and match normalized digits
  if (serverOrders.length === 0 && (last10 || rawPhone)) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (res.ok) {
        const all = await res.json();
        if (Array.isArray(all)) {
          serverOrders = all.filter((o) => {
            const p = (o.customerPhone || "").replace(/\D/g, "");
            return (
              (last10 && p.endsWith(last10)) ||
              (rawPhone && (o.customerPhone || "").includes(rawPhone))
            );
          });
        }
      }
    } catch (e) {
      // fallback
    }
  }

  const localOrders = getLocalOrders();
  const matchingLocal = localOrders.filter((o) => {
    const p = (o.customerPhone || "").replace(/\D/g, "");
    return (
      (last10 && p.endsWith(last10)) ||
      (rawPhone && (o.customerPhone || "").includes(rawPhone))
    );
  });

  // Combine unique orders
  const seenIds = new Set(serverOrders.map((o) => o.id));
  const combined = [...serverOrders, ...matchingLocal.filter((o) => !seenIds.has(o.id))];

  if (combined.length > 0) return combined;

  // Check last placed order
  try {
    const lastPlaced = localStorage.getItem("food_last_placed_order");
    if (lastPlaced) {
      const parsed = JSON.parse(lastPlaced);
      const p = (parsed.customerPhone || "").replace(/\D/g, "");
      if ((last10 && p.endsWith(last10)) || (rawPhone && (parsed.customerPhone || "").includes(rawPhone))) {
        return [parsed];
      }
    }
  } catch (e) {
    // ignore
  }

  throw new Error("Could not find orders for this phone number");
};

export const getAllOrders = async () => {
  let serverOrders = [];
  try {
    const res = await fetch(`${API_BASE_URL}/orders`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        serverOrders = data;
      }
    }
  } catch (err) {
    // silent fallback
  }

  const localOrders = getLocalOrders();
  const seenIds = new Set(serverOrders.map((o) => o.id));
  const combined = [...serverOrders, ...localOrders.filter((o) => !seenIds.has(o.id))];

  // Retrieve all reviews to link them to orders
  const allReviews = await getReviews();

  // Attach reviews if matching
  const enriched = combined.map((ord) => {
    if (!ord.review) {
      const match = allReviews.find(
        (rev) => String(rev.orderId) === String(ord.id) || (ord.customerPhone && rev.customerPhone === ord.customerPhone)
      );
      if (match) {
        return { ...ord, review: match };
      }
    }
    return ord;
  });

  // Sort newest first
  enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return enriched;
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }

  const localOrders = getLocalOrders();
  const updatedList = localOrders.map((o) =>
    String(o.id) === String(orderId) ? { ...o, orderStatus: status } : o
  );
  saveLocalOrders(updatedList);
  return updatedList.find((o) => String(o.id) === String(orderId));
};

export const addFood = async (foodData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/foods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(foodData),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback
  }
  return foodData;
};

export const getReviews = async () => {
  let serverReviews = [];
  try {
    const res = await fetch(`${API_BASE_URL}/reviews`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) serverReviews = data;
    }
  } catch {
    // fallback
  }

  const local = localStorage.getItem("food_customer_reviews");
  let localReviews = [];
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) localReviews = parsed;
    } catch (e) {
      // ignore
    }
  }

  if (localReviews.length === 0 && serverReviews.length === 0) {
    localReviews = DEFAULT_REVIEWS;
    try {
      localStorage.setItem("food_customer_reviews", JSON.stringify(DEFAULT_REVIEWS));
    } catch {}
  }

  const seenIds = new Set(serverReviews.map((r) => r.id));
  const combined = [...serverReviews, ...localReviews.filter((r) => !seenIds.has(r.id))];
  combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return combined;
};

export const submitReview = async (reviewData) => {
  const newReview = {
    id: Date.now(),
    customerName: reviewData.customerName || "Happy Customer",
    customerPhone: reviewData.customerPhone || "",
    rating: Number(reviewData.rating || 5),
    comment: reviewData.comment || "Great food and fast service!",
    orderId: reviewData.orderId ? String(reviewData.orderId) : null,
    foodName: reviewData.foodName || "",
    createdAt: new Date().toISOString(),
  };

  // 1. Save to local storage
  const existing = await getReviews();
  const updated = [newReview, ...existing.filter((r) => r.id !== newReview.id)];
  try {
    localStorage.setItem("food_customer_reviews", JSON.stringify(updated));
  } catch (e) {
    console.warn("Storage error for reviews:", e);
  }

  // 2. Attach directly to local orders
  if (reviewData.orderId) {
    attachReviewToOrder(reviewData.orderId, newReview);
  }

  // 3. Dispatch global custom event for instant live UI sync
  try {
    window.dispatchEvent(new CustomEvent("food_express_review_added", { detail: newReview }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}

  // 4. Try backend sync
  try {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReview),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  return newReview;
};
