
import OrderForm from "@/components/OrderForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Part Order System</h1>
          <p className="text-gray-600">
            Request parts, review pricing, and confirm your order
          </p>
        </div>
        
        <OrderForm />
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>For questions regarding your order, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
