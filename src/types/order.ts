export type OrderStatus = 'created' | 'assigned' | 'picked_up' | 'delivered' | 'canceled' |'pending' | 'in_progress' | 'completed';


export interface Order {
  id?: string;
  businessId: string;         // מזהה העסק המזמין
  businessName: string;
  pickupAddress: string;
  dropoffAddress: string;
  contactName: string;
  contactPhone: string;
  cashOnDelivery?: number;     // אופציונלי (מזומן לנהג)
  notes?: string;

  driverId?: string;           // יוגדר כשמשייכים שליח
  driverName?: string;

  status: OrderStatus;
  createdAt: number;           // Date.now()
  createdBy: string;           // uid של מי שיצר
  updatedAt?: number;
}
