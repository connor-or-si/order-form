
// Service to handle webhook communications

export interface OrderRequest {
  partId: string;
  deliveryDate: string;
  quantity: number;
}

export interface OrderConfirmation {
  orderId: string;
  partId: string;
  confirmedDeliveryDate: string;
  price: number;
  quantity: number;
}

// Simulates sending order request to webhook
export const submitOrderRequest = async (orderData: OrderRequest): Promise<string> => {
  // In a real app, this would be an actual webhook URL
  console.log("Submitting order request:", orderData);
  
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a request ID to identify this request
      resolve(`request-${Date.now()}`);
    }, 1500);
  });
};

// Simulates the webhook response (which would typically be received via a separate endpoint)
export const mockReceiveConfirmation = async (requestId: string, orderData: OrderRequest): Promise<OrderConfirmation> => {
  // In a real app, this would be a webhook or polling mechanism that waits for a response
  console.log("Waiting for confirmation for request:", requestId);
  
  // Simulate API call delay (this mimics waiting for the webhook response)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Calculate a mock price based on quantity
      const unitPrice = 10.99 + (Math.random() * 5);
      const price = parseFloat((unitPrice * orderData.quantity).toFixed(2));
      
      // Add 2-4 business days for the confirmed delivery date
      const deliveryDate = new Date(orderData.deliveryDate);
      deliveryDate.setDate(deliveryDate.getDate() + 2 + Math.floor(Math.random() * 3));
      
      resolve({
        orderId: `ORD-${Date.now().toString().substr(-6)}`,
        partId: orderData.partId,
        confirmedDeliveryDate: deliveryDate.toISOString().split('T')[0],
        price,
        quantity: orderData.quantity
      });
    }, 3000); // 3 second delay to simulate processing time
  });
};
