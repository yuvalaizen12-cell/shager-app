import { Courier, Restaurant, Order, DailySummary, CourierStatus } from "./models";

export interface DataStore {
  // Couriers
  listCouriers(): Promise<Courier[]>;
  createCourier(
    c: Omit<Courier, "id" | "status" | "currentOrderId"> & { status?: CourierStatus }
  ): Promise<Courier>;
  updateCourier(id: string, patch: Partial<Courier>): Promise<Courier>;
  deleteCourier(id: string): Promise<void>;

  // סיסמאות/לוגין לשליחים
  setCourierPassword(email: string, password: string): Promise<void>;
  resetCourierPassword(email: string, password: string): Promise<void>;
  authLoginCourier(email: string, password: string): Promise<Courier | null>;

  // Restaurants
  listRestaurants(): Promise<Restaurant[]>;
  createRestaurant(
    r: Omit<Restaurant, "id" | "isActive"> & { isActive?: boolean }
  ): Promise<Restaurant>;
  updateRestaurant(id: string, patch: Partial<Restaurant>): Promise<Restaurant>;
  deleteRestaurant(id: string): Promise<void>;

  // סיסמאות/לוגין למסעדות
  setRestaurantPassword(email: string, password: string): Promise<void>;
  resetRestaurantPassword(email: string, password: string): Promise<void>;
  authLoginRestaurant(email: string, password: string): Promise<Restaurant | null>;

  // Orders
  listOrders(filter?: { status?: Order["status"] }): Promise<Order[]>;
  createOrder(o: Omit<Order, "id">): Promise<Order>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order>;

  // Assigning / Flow
  assignOrder(orderId: string, courierId: string): Promise<void>;         // שיבוץ הזמנה "unassigned"
  reassignOrder(orderId: string, newCourierId: string): Promise<void>;    // החלפת שליח להזמנה משובצת/נאספה
  cancelOrder(orderId: string): Promise<void>;                            // ביטול הזמנה
  markPickedUp(orderId: string): Promise<void>;
  markDelivered(orderId: string): Promise<void>;

  // Reports
  getDailySummary(dateISO: string): Promise<DailySummary[]>;

  // (אופציונלי) מנוי לשינויים – לרענון UI
  onOrdersSubscribe?(cb: () => void): () => void;
}

// --- In-memory (פיתוח/דמו) ---
const mem: {
  couriers: Courier[];
  restaurants: Restaurant[];
  orders: Order[];
  courierCreds: Record<string, string>;    // email -> password
  restaurantCreds: Record<string, string>; // email -> password
  listeners: Set<() => void>;
} = {
  couriers: [],
  restaurants: [],
  orders: [],
  courierCreds: {},
  restaurantCreds: {},
  listeners: new Set(),
};

const genId = () => Math.random().toString(36).slice(2);
const emit = () => { mem.listeners.forEach(fn => { try { fn(); } catch { /* ignore */ } }); };

// מחשב סטטוס שליח לפי ההזמנות הפעילות שלו (assigned/picked_up)
function recomputeCourierStatus(courierId: string) {
  const c = mem.couriers.find(x => x.id === courierId);
  if (!c) return;
  const active = mem.orders.filter(
    o => o.assignedCourierId === courierId && (o.status === "assigned" || o.status === "picked_up")
  );
  c.currentOrderId = active[0]?.id ?? null;
  if (active.length === 0) {
    c.status = "available";
  } else {
    c.status = active.some(o => o.status === "picked_up") ? "delivering" : "assigned";
  }
}

export const InMemoryStore: DataStore = {
  // Couriers
  async listCouriers() { return mem.couriers; },

  async createCourier(c) {
    if (c.email) {
      const exists = mem.couriers.some(x => x.email?.toLowerCase() === c.email!.toLowerCase());
      if (exists) throw new Error("כבר קיים שליח עם האימייל הזה");
    }
    const created: Courier = {
      id: genId(),
      name: c.name,
      phone: c.phone,
      email: c.email,
      vehicle: c.vehicle,
      status: c.status ?? "available",
      currentOrderId: null,
    };
    mem.couriers.push(created);
    emit();
    return created;
  },

  async updateCourier(id, patch) {
    const i = mem.couriers.findIndex(c => c.id === id);
    if (i === -1) throw new Error("Courier not found");
    mem.couriers[i] = { ...mem.couriers[i], ...patch };
    emit();
    return mem.couriers[i];
  },

  async deleteCourier(id) {
    const i = mem.couriers.findIndex(c => c.id === id);
    if (i === -1) throw new Error("Courier not found");
    const hasActive = mem.orders.some(
      o => o.assignedCourierId === id && (o.status === "assigned" || o.status === "picked_up")
    );
    if (hasActive) throw new Error("אי אפשר למחוק שליח עם משימות פעילות");
    const c = mem.couriers[i];
    if (c.email) delete mem.courierCreds[c.email.toLowerCase()];
    mem.couriers.splice(i, 1);
    emit();
  },

  async setCourierPassword(email, password) {
    if (!email) throw new Error("חסר אימייל");
    mem.courierCreds[email.toLowerCase()] = password;
  },
  async resetCourierPassword(email, password) {
    return this.setCourierPassword(email, password);
  },
  async authLoginCourier(email, password) {
    const pass = mem.courierCreds[email.toLowerCase()];
    if (!pass || pass !== password) return null;
    return mem.couriers.find(c => c.email?.toLowerCase() === email.toLowerCase()) ?? null;
  },

  // Restaurants
  async listRestaurants() { return mem.restaurants; },

  async createRestaurant(r) {
    if (r.email) {
      const exists = mem.restaurants.some(x => x.email?.toLowerCase() === r.email!.toLowerCase());
      if (exists) throw new Error("כבר קיימת מסעדה עם האימייל הזה");
    }
    const created: Restaurant = { id: genId(), isActive: r.isActive ?? true, ...r };
    mem.restaurants.push(created);
    emit();
    return created;
  },

  async updateRestaurant(id, patch) {
    const i = mem.restaurants.findIndex(r => r.id === id);
    if (i === -1) throw new Error("Restaurant not found");
    mem.restaurants[i] = { ...mem.restaurants[i], ...patch };
    emit();
    return mem.restaurants[i];
  },

  async deleteRestaurant(id) {
    const i = mem.restaurants.findIndex(r => r.id === id);
    if (i === -1) throw new Error("Restaurant not found");
    const r = mem.restaurants[i];

    // מחיקת קרדנצ'יאלס (אם קיימים)
    if (r.email) delete mem.restaurantCreds[r.email.toLowerCase()];

    // טיפול בהזמנות שקשורות למסעדה:
    // מבטלים הזמנות פעילות ומעדכנים סטטוסים של שליחים, ואז מוחקים את כל ההזמנות של המסעדה.
    for (const o of mem.orders.filter(o => o.restaurantId === id)) {
      if (o.status === "assigned" || o.status === "picked_up") {
        o.status = "canceled";
        const cid = o.assignedCourierId ?? undefined;
        if (cid) recomputeCourierStatus(cid);
      }
    }
    mem.orders = mem.orders.filter(o => o.restaurantId !== id);

    // הסרת המסעדה
    mem.restaurants.splice(i, 1);
    emit();
  },

  async setRestaurantPassword(email, password) {
    if (!email) throw new Error("חסר אימייל");
    mem.restaurantCreds[email.toLowerCase()] = password;
  },
  async resetRestaurantPassword(email, password) {
    return this.setRestaurantPassword(email, password);
  },
  async authLoginRestaurant(email, password) {
    const pass = mem.restaurantCreds[email.toLowerCase()];
    if (!pass || pass !== password) return null;
    return mem.restaurants.find(r => r.email?.toLowerCase() === email.toLowerCase()) ?? null;
  },

  // Orders
  async listOrders(filter) {
    const all = mem.orders;
    if (!filter?.status) return all;
    return all.filter(o => o.status === filter.status);
  },

  async createOrder(o) {
    const created: Order = { id: genId(), ...o };
    mem.orders.push(created);
    emit();
    return created;
  },

  async updateOrder(id, patch) {
    const i = mem.orders.findIndex(o => o.id === id);
    if (i === -1) throw new Error("Order not found");
    mem.orders[i] = { ...mem.orders[i], ...patch };
    emit();
    return mem.orders[i];
  },

  // Assigning / Flow
  async assignOrder(orderId, courierId) {
    const order = mem.orders.find(o => o.id === orderId);
    const courier = mem.couriers.find(c => c.id === courierId);
    if (!order || !courier) throw new Error("Not found");
    if (order.status !== "unassigned") throw new Error("Order not available to assign");
    order.status = "assigned";
    order.assignedCourierId = courierId;
    order.assignedAt = new Date().toISOString();
    recomputeCourierStatus(courierId);
    emit();
  },

  async reassignOrder(orderId, newCourierId) {
    const order = mem.orders.find(o => o.id === orderId);
    const newC = mem.couriers.find(c => c.id === newCourierId);
    if (!order || !newC) throw new Error("Not found");
    const oldId = order.assignedCourierId ?? undefined;
    if (order.status === "unassigned") {
      order.status = "assigned";
      order.assignedAt = order.assignedAt ?? new Date().toISOString();
    }
    order.assignedCourierId = newCourierId;
    if (oldId) recomputeCourierStatus(oldId);
    recomputeCourierStatus(newCourierId);
    emit();
  },

  async cancelOrder(orderId) {
    const order = mem.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = "canceled";
    const cid = order.assignedCourierId ?? undefined;
    if (cid) recomputeCourierStatus(cid);
    emit();
  },

  async markPickedUp(orderId) {
    const order = mem.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = "picked_up";
    order.pickedUpAt = new Date().toISOString();
    const cid = order.assignedCourierId ?? undefined;
    if (cid) recomputeCourierStatus(cid);
    emit();
  },

  async markDelivered(orderId) {
    const order = mem.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = "delivered";
    order.deliveredAt = new Date().toISOString();
    const cid = order.assignedCourierId ?? undefined;
    if (cid) recomputeCourierStatus(cid);
    emit();
  },

  async getDailySummary(dateISO) {
    const day = dateISO.slice(0, 10);
    const byRestaurant = new Map<string, DailySummary>();
    for (const o of mem.orders.filter(
      o => o.status === "delivered" && (o.dueAt ?? o.deliveredAt ?? "").slice(0, 10) === day
    )) {
      const r = o.restaurantId;
      if (!byRestaurant.has(r)) {
        byRestaurant.set(r, { restaurantId: r, date: day, ordersCount: 0, totalRevenue: 0, orders: [] });
      }
      const entry = byRestaurant.get(r)!;
      entry.ordersCount += 1;
      entry.totalRevenue += o.price;
      const courierName = mem.couriers.find(c => c.id === o.assignedCourierId)?.name;
      entry.orders.push({ id: o.id, price: o.price, dropoffAddress: o.dropoffAddress, courierName });
    }
    return Array.from(byRestaurant.values());
  },

  onOrdersSubscribe(cb?: () => void) {
    if (!cb) return () => {};
    mem.listeners.add(cb);
    return () => mem.listeners.delete(cb);
  },
};

// --- Demo seeding ---
export async function seedDemoData() {
  if (mem.couriers.length || mem.restaurants.length || mem.orders.length) return;

  const r1 = await InMemoryStore.createRestaurant({
    name: "פיצה טוני",
    address: "מזלג 5, תל אביב",
    phone: "03-7777777",
    ownerName: "טוני",
    email: "tony@pizza.com",
    isActive: true,
  });
  await InMemoryStore.setRestaurantPassword("tony@pizza.com", "1234");

  const r2 = await InMemoryStore.createRestaurant({
    name: "החומוסיה",
    address: "אחד העם 10, תל אביב",
    ownerName: "אורי",
    email: "hummus@place.com",
    phone: "03-8888888",
    isActive: true,
  });
  await InMemoryStore.setRestaurantPassword("hummus@place.com", "1234");

  await InMemoryStore.createCourier({
    name: "דני",
    phone: "050-1111111",
    email: "dani@example.com",
    vehicle: "bike",
    status: "available",
  });
  await InMemoryStore.setCourierPassword("dani@example.com", "1234");

  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();

  // שתי הזמנות דמו לא משובצות
  await InMemoryStore.createOrder({
    restaurantId: r1.id,
    pickupAddress: r1.address,
    dropoffAddress: "בן יהודה 50, תל אביב",
    price: 68,
    placedAt: iso(now - 10 * 60 * 1000),
    dueAt: iso(now + 45 * 60 * 1000),
    status: "unassigned",
    assignedCourierId: null,
    assignedAt: null,
    pickedUpAt: null,
    deliveredAt: null,
  });

  await InMemoryStore.createOrder({
    restaurantId: r2.id,
    pickupAddress: r2.address,
    dropoffAddress: "בן יהודה 90, תל אביב",
    price: 54,
    placedAt: iso(now - 20 * 60 * 1000),
    dueAt: iso(now + 15 * 60 * 1000),
    status: "unassigned",
    assignedCourierId: null,
    assignedAt: null,
    pickedUpAt: null,
    deliveredAt: null,
  });
}
