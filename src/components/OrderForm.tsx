
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchParts, Part } from '../services/partDataService';
import { submitOrderRequest, mockReceiveConfirmation, OrderRequest, OrderConfirmation } from '../services/webhookService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Form Steps enum
enum FormStep {
  Initial = 'initial',
  Loading = 'loading',
  Confirmation = 'confirmation',
  Complete = 'complete',
}

const OrderForm = () => {
  // State
  const [step, setStep] = useState<FormStep>(FormStep.Initial);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState<OrderRequest>({
    partId: '',
    deliveryDate: '',
    quantity: 1,
  });
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
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
      setFormData({
        ...formData,
        deliveryDate: newDate.toISOString().split('T')[0],
      });
    }
  };

  // Handle form input changes
  const handleChange = (field: keyof OrderRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.partId || !formData.deliveryDate || formData.quantity < 1) {
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
      const id = await submitOrderRequest(formData, webhookUrl || undefined);
      setRequestId(id);
      
      // In a real application, we would now wait for a webhook callback with the confirmation data
      // For this demo, we'll simulate receiving the webhook response
      const confirmationData = await mockReceiveConfirmation(id, formData);
      setConfirmation(confirmationData);
      setStep(FormStep.Confirmation);
      
    } catch (error) {
      toast({
        title: "Error submitting order",
        description: webhookUrl 
          ? "Failed to send data to the specified webhook URL. Please check the URL and try again."
          : "Could not submit your order. Please try again later.",
        variant: "destructive"
      });
      setStep(FormStep.Initial);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = () => {
    setStep(FormStep.Complete);
    toast({
      title: "Order Confirmed!",
      description: `Your order #${confirmation?.orderId} has been placed successfully.`,
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
      partId: '',
      deliveryDate: '',
      quantity: 1,
    });
    setDate(undefined);
    setConfirmation(null);
    setRequestId(null);
    setStep(FormStep.Initial);
  };

  // Render the initial order form
  const renderInitialForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="part">Part Number</Label>
          <Select
            value={formData.partId}
            onValueChange={(value) => handleChange('partId', value)}
            disabled={isLoadingParts}
          >
            <SelectTrigger id="part" className="w-full">
              <SelectValue placeholder="Select a part number" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.id} value={part.id}>
                  {part.id} - {part.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.partId && (
            <p className="text-sm text-muted-foreground">
              {parts.find(p => p.id === formData.partId)?.description}
            </p>
          )}
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

        {/* Webhook Configuration */}
        <Collapsible open={showWebhookConfig} onOpenChange={setShowWebhookConfig} className="border rounded-md p-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-toggle" className="cursor-pointer flex items-center gap-2">
              <Link size={16} />
              <span>Webhook Configuration</span>
            </Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <span className={cn("transition-transform", showWebhookConfig ? "rotate-180" : "")}>
                  ⌄
                </span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-webhook-url.com"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, simulated mode will be used.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Button type="submit" className="w-full" disabled={!formData.partId || !formData.deliveryDate || formData.quantity < 1}>
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
    if (!confirmation) return null;
    
    const selectedPart = parts.find(p => p.id === confirmation.partId);
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Order Details</h3>
            <Separator />
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Part:</div>
              <div className="font-medium">{confirmation.partId} - {selectedPart?.name}</div>
              
              <div className="text-muted-foreground">Description:</div>
              <div>{selectedPart?.description}</div>
              
              <div className="text-muted-foreground">Quantity:</div>
              <div>{confirmation.quantity}</div>
              
              <div className="text-muted-foreground">Delivery Date:</div>
              <div className="font-medium">{new Date(confirmation.confirmedDeliveryDate).toLocaleDateString()}</div>
              
              <div className="text-muted-foreground">Price:</div>
              <div className="font-medium">${confirmation.price.toFixed(2)}</div>
              
              <div className="text-muted-foreground">Order ID:</div>
              <div>{confirmation.orderId}</div>
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
    if (!confirmation) return null;
    
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Order Successfully Placed!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your order #{confirmation.orderId} has been confirmed.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">You will receive a confirmation email shortly.</p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Delivery Date: </span>
            <span className="font-medium">{new Date(confirmation.confirmedDeliveryDate).toLocaleDateString()}</span>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Total Price: </span>
            <span className="font-medium">${confirmation.price.toFixed(2)}</span>
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
