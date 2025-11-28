// order data from configurator to be saved in the database
export interface Order {
    id: number;
    dealerId: number;

    status: 'Pending' | 'Confirmed' | 'In Production' | 'Shipped' | 'Cancelled';

    customerName: string;
    configuration: any; // with saying any, we can store any configuration object

    createdAt: Date;
    updatedAt: Date;
}

// DTO for creating a new order
export interface CreateOrderDTO {
    dealerId: number;
    customerName: string;
    configuration: any;
}