// כלי רכב אפשריים
export type VehicleType = "bike" | "scooter" | "motorcycle" | "car";

// סטטוסי שליח
export type CourierStatus = "available" | "assigned" | "delivering";

// מודל שליח
export interface Courier {
  id: string;
  name: string;
  phone: string;
  email?: string;                 // שם משתמש (אימייל)
  vehicle?: VehicleType;
  status: CourierStatus;
  currentOrderId?: string | null;
}

// מודל מסעדה (עם בעל העסק ואימייל ללוגין)
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;                 // טלפון עסק/בעלים
  ownerName?: string;             // שם בעל העסק
  email?: string;                 // שם משתמש (אימייל)
  isActive: boolean;
}

// סטטוס להזמנה
export type OrderStatus =
  | "pending"
  | "ready"
  | "unassigned"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "canceled"
  | "paid";

// מודל הזמנה
export interface Order {
  id: string;
  restaurantId: string;
  pickupAddress: string;
  dropoffAddress: string;

  price: number;
  placedAt: string;         // ISO
  dueAt?: string | null;    // ISO

  status: OrderStatus;

  assignedCourierId?: string | null;

  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
}

// סיכום יומי למסעדה
export interface DailySummary {
  restaurantId: string;
  date: string; // YYYY-MM-DD
  ordersCount: number;
  totalRevenue: number;
  orders: Array<{
    id: string;
    price: number;
    dropoffAddress: string;
    courierName?: string;
  }>;
}
