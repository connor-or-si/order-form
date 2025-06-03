
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchParts, getPartById, Part } from '../services/partDataService';
import { submitOrderRequest, receiveOrderDetails, OrderRequest, OrderDetails, submitOrderConfirmation, OrderConfirmation  } from '../services/webhookService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { DateTime } from 'luxon';

// Form Steps enum
enum FormStep {
  Initial = 'initial',
  Loading = 'loading',
  Confirmation = 'confirmation',
  Complete = 'complete',
}

function formatDateToDDMMMYYYY(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    const monthAbbrs = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthAbbrs[d.getMonth()];

    return `${day}-${month}-${year}`;
}

const OrderForm = () => {
  // State
  const [step, setStep] = useState<FormStep>(FormStep.Initial);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [expedite, setExpedite] = useState(false);
  const [formData, setFormData] = useState<OrderRequest>({
    partNumber: '',
    deliveryDate: '',
    quantity: 1,
    expedite: false,
  });
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const { toast } = useToast();

  // Load parts data on component mount
  useEffect(() => {
    const loadParts = async () => {
      try {
        const partsData = await fetchParts();
        setParts(partsData);
      } catch (error) {
        toast({
          title: "Error loading parts",
          description: "Could not load parts from the database. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingParts(false);
      }
    };

    loadParts();
  }, []);

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const formattedDate = formatDateToDDMMMYYYY(newDate);
      
      setFormData({
        ...formData,
        deliveryDate: formattedDate,
      });
    }
  };

  // Handle expedite change
  const handleExpediteChange = (checked: boolean) => {
    setExpedite(checked);
    setFormData({ ...formData, expedite: checked });
  };

  // Handle form input changes
  const handleChange = (field: keyof OrderRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.partNumber || !formData.deliveryDate || formData.quantity < 1) {
      toast({
        title: "Please fill out all fields",
        description: "All fields are required to submit your order request.",
        variant: "destructive"
      });
      return;
    }

    try {
      setStep(FormStep.Loading);
      // Submit the form data to webhook
      const response = await submitOrderRequest(formData, 'http://localhost:5678/webhook-test/af6e2ab6-3f3e-4537-9d5f-78188bb257e7');
      
      // In a real application, we would now wait for a webhook callback with the confirmation data
      // For this demo, we'll simulate receiving the webhook response
      const orderData = await receiveOrderDetails(response);
      setDetails(orderData);
      setStep(FormStep.Confirmation);
      
    } catch (error) {
      toast({
        title: "Error submitting order",
        description: "Could not submit your order. Please try again later.",
        variant: "destructive"
      });
      setStep(FormStep.Initial);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    const orderConfirmation: OrderConfirmation = {
      part: getPartById(details.partNumber).name,
      partNumber: details.partNumber,
      curDate: DateTime.now().toFormat('dd-MMM-yyyy'),
      orderDate: details.requestedDate,
      facility: 'ORG',
      quantity: details.orderQty,
      price: details.price,
      totalCost: details.price * details.orderQty,
      numPacks: details.numPacks,
      expeditite: details.expedite
    };

    await submitOrderConfirmation(orderConfirmation, 'http://localhost:5678/webhook-test/ab613fba-ef27-4db4-bd19-c3503a11538f');

    setStep(FormStep.Complete);
    toast({
      title: "Order Confirmed!",
      description: `Your order has been placed successfully.`,
    });
  };

  // Handle order cancellation
  const handleCancelOrder = () => {
    setStep(FormStep.Initial);
    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled.",
    });
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      partNumber: '',
      deliveryDate: '',
      quantity: 1,
    });
    setDate(undefined);
    setStep(FormStep.Initial);
  };

  // Render the initial order form
  const renderInitialForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="part">Part Number</Label>
          <Select
            value={formData.partNumber}
            onValueChange={(value) => handleChange('partNumber', value)}
            disabled={isLoadingParts}
          >
            <SelectTrigger id="part" className="w-full">
              <SelectValue placeholder="Select a part number" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.name} value={part.id}>
                  {part.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Desired Delivery Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Select a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="expedite"
            checked={expedite}
            onCheckedChange={handleExpediteChange}
          />
          <Label htmlFor="expedite" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Expedite this request
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!formData.partNumber || !formData.deliveryDate || formData.quantity < 1}>
        Submit Request
      </Button>
    </form>
  );

  // Render the loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium">Processing your order request...</p>
      <p className="text-sm text-muted-foreground">Please wait while we check availability and pricing.</p>
    </div>
  );

  // Render the confirmation step
  const renderConfirmation = () => {
    if (!details) return null;

    if (details.orderQty == 0) {
      return (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Order Details</h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Part:</div>
                <div className="font-medium">{getPartById(details.partNumber).name}</div>
                
                <div className="text-muted-foreground">Desired Date:</div>
                <div>{details.requestedDate}</div>

                <div className="text-muted-foreground">Expedited:</div>
                <div>{details.expedite === "Y" ? 'Yes' : 'No'}</div>
                
                <div className="text-muted-foreground">Available Date For Desired Qty:</div>
                <div>{details.availableDate}</div>

                <div className="text-muted-foreground">MOQ:</div>
                <div className="font-medium">{details.MOQ}</div>

                <div className="text-muted-foreground">Desired Qty:</div>
                <div className="font-medium">{details.desiredQty}</div>

                <div className="text-muted-foreground">Order Qty:</div>
                <div className="font-medium">{details.orderQty}</div>
                
                <div className="text-muted-foreground">Part Price:</div>
                <div className="font-medium">${details.price.toFixed(2)}</div>
                
                <div className="text-muted-foreground">Total Cost:</div>
                <div className="font-medium">${(details.price * details.orderQty).toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Sorry, there is nothing available for this date, please try again.
          </p>
          
          <div className="flex gap-3">
            <Button onClick={handleCancelOrder} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Order Details</h3>
            <Separator />
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Part:</div>
              <div className="font-medium">{getPartById(details.partNumber).name}</div>
              
              <div className="text-muted-foreground">Desired Date:</div>
              <div>{details.requestedDate}</div>

              <div className="text-muted-foreground">Expedited:</div>
              <div>{details.expedite === "Y" ? 'Yes' : 'No'}</div>
              
              <div className="text-muted-foreground">Available Date For Desired Qty:</div>
              <div>{details.availableDate}</div>

              <div className="text-muted-foreground">MOQ:</div>
              <div className="font-medium">{details.MOQ}</div>

              <div className="text-muted-foreground">Desired Qty:</div>
              <div className="font-medium">{details.desiredQty}</div>

              <div className="text-muted-foreground">Order Qty:</div>
              <div className="font-medium">{details.orderQty}</div>
              
              <div className="text-muted-foreground">Part Price:</div>
              <div className="font-medium">${details.price.toFixed(2)}</div>
              
              <div className="text-muted-foreground">Total Cost:</div>
              <div className="font-medium">${(details.price * details.orderQty).toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Please confirm or cancel your order.
        </p>
        
        <div className="flex gap-3">
          <Button onClick={handleCancelOrder} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirmOrder} className="flex-1">
            Confirm Order
          </Button>
        </div>
      </div>
    );
  };

  // Render the completion step
  const renderComplete = () => {
    if (!details) return null;
    
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Order Successfully Placed!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your order has been confirmed.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">You will receive a confirmation email shortly.</p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Order Date: </span>
            <span className="font-medium">{details.availableDate}</span>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Total Price: </span>
            <span className="font-medium">${(details.price * details.orderQty).toFixed(2)}</span>
          </p>
        </div>
        
        <Button onClick={handleReset} className="w-full">
          Place Another Order
        </Button>
      </div>
    );
  };

  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case FormStep.Initial:
        return renderInitialForm();
      case FormStep.Loading:
        return renderLoading();
      case FormStep.Confirmation:
        return renderConfirmation();
      case FormStep.Complete:
        return renderComplete();
      default:
        return renderInitialForm();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Order Request Form</CardTitle>
        <CardDescription>
          {step === FormStep.Initial && "Request parts for your project"}
          {step === FormStep.Loading && "Processing your request"}
          {step === FormStep.Confirmation && "Please confirm your order details"}
          {step === FormStep.Complete && "Thank you for your order"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
      {step === FormStep.Initial && (
        <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-6">
          <span>All fields are required</span>
          <span>* Prices may vary based on availability</span>
        </CardFooter>
      )}
    </Card>
  );
};

export default OrderForm;
