export interface OrderRequest {
  partNumber: string;
  deliveryDate: string;
  quantity: number;
  expedite?: boolean;
}

export interface OrderDetails {
  partNumber: string;
  requestedDate: string;
  availableDate: string;
  price: number;
  MOQ: number;
  desiredQty: number;
  orderQty: number;
  numPacks: number;
  expedite: boolean;
}

export interface OrderConfirmation {
  part: string;
  partNumber: string;
  curDate: string;
  orderDate: string;
  facility: string;
  quantity: number;
  price: number;
  totalCost: number;
  numPacks: number;
}

export const submitOrderConfirmation = async (orderConfirmation: OrderConfirmation, webhookUrl?: string): Promise<void> => {
  if (webhookUrl) {
    console.log(`Submitting order request to webhook: ${webhookUrl}`, orderConfirmation);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderConfirmation),
        mode: 'cors', // Change this to 'no-cors' if you encounter CORS issues
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // If using no-cors mode, you won't be able to read the response
      // so we'll just return a generated request ID
    } catch (error) {
      console.error("Error submitting to webhook:", error);
      throw error;
    }
  } else {
    // Fallback to simulation mode
    console.log("Simulation mode: Submitting order request:", orderConfirmation);
    
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return a request ID to identify this request
        resolve(null);
      }, 1500);
    });
  }
}

export const submitOrderRequest = async (orderData: OrderRequest, webhookUrl?: string): Promise<Response> => {
  // Use provided webhook URL or fallback to simulation mode
  if (webhookUrl) {
    console.log(`Submitting order request to webhook: ${webhookUrl}`, orderData);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        mode: 'cors', // Change this to 'no-cors' if you encounter CORS issues
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // If using no-cors mode, you won't be able to read the response
      // so we'll just return a generated request ID
      return response;
    } catch (error) {
      console.error("Error submitting to webhook:", error);
      throw error;
    }
  } else {
    // Fallback to simulation mode
    console.log("Simulation mode: Submitting order request:", orderData);
    
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return a request ID to identify this request
        resolve(null);
      }, 1500);
    });
  }
};

export const receiveOrderDetails = async (response: Response): Promise<OrderDetails> => {
  // In a real app, this would be a webhook or polling mechanism that waits for a response
  try {
    console.log('Waiting for webhook...');
      
    const webhookData = await response.json();
    
    console.log('Webhook received:', webhookData);

    const order: OrderDetails = {
      partNumber: webhookData.partNumber,
      requestedDate: webhookData.requestedDate,
      availableDate: webhookData.availableDate,
      price: Number(webhookData.price.split(' ')[0]),
      MOQ: webhookData.MOQ,
      desiredQty: webhookData.desiredQty,
      orderQty: webhookData.todayOrderQty,
      numPacks: webhookData.numPacks,
      expedite: webhookData.expedite
    };

    return order;
  } catch (error) {
    console.error('Error in main function:', error.message);
    throw error;
  }
};
