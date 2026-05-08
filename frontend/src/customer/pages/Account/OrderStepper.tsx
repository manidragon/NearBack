// frontend/src/customer/pages/Account/OrderStepper.tsx

import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// ✅ Delivery steps
const deliverySteps = [
  { name: "Order Placed", description: "Order has been placed", value: "PLACED" },
  { name: "Packed", description: "Item packed in warehouse", value: "CONFIRMED" },
  { name: "Shipped", description: "Order is on the way", value: "SHIPPED" },
  { name: "Out for Delivery", description: "Arriving soon", value: "OUT_FOR_DELIVERY" },
  { name: "Delivered", description: "Order delivered successfully", value: "DELIVERED" },
];

// ✅ Self Pickup steps
const pickupSteps = [
  { name: "Order Placed", description: "Order has been placed", value: "PLACED" },
  { name: "Confirmed", description: "Order confirmed by seller", value: "CONFIRMED" },
  { name: "Ready for Pickup", description: "Your order is ready at the store", value: "READY_FOR_PICKUP" },
  { name: "Picked Up", description: "Order collected from store", value: "DELIVERED" },
];

// Canceled steps (common for both)
const canceledStep = [
  { name: "Order Placed", description: "Order was placed", value: "PLACED" },
  { name: "Order Canceled", description: "Order has been canceled", value: "CANCELLED" },
];

interface OrderStepperProps {
  orderStatus: string;
  fulfillmentType?: 'DELIVERY' | 'SELF_PICKUP';
}

const OrderStepper = ({ orderStatus, fulfillmentType = 'DELIVERY' }: OrderStepperProps) => {
  const [statusStep, setStatusStep] = useState(deliverySteps);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (orderStatus === 'CANCELLED') {
      setStatusStep(canceledStep);
      const stepIndex = canceledStep.findIndex(step => step.value === orderStatus);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    } else if (fulfillmentType === 'SELF_PICKUP') {
      // ✅ Use pickup steps for self-pickup orders
      setStatusStep(pickupSteps);
      const stepIndex = pickupSteps.findIndex(step => step.value === orderStatus);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    } else {
      // ✅ Default to delivery steps
      setStatusStep(deliverySteps);
      const stepIndex = deliverySteps.findIndex(step => step.value === orderStatus);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
    }
  }, [orderStatus, fulfillmentType]);

  return (
    <Box className="mx-auto my-10">
      {statusStep.map((step, index) => (
        <div key={index} className="flex px-4">
          <div className="flex flex-col items-center">
            <Box
              className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                index <= currentStep
                  ? "bg-gray-200 text-teal-500"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index < currentStep ? (
                <CheckCircleIcon />
              ) : (
                <FiberManualRecordIcon />
              )}
            </Box>
            {index < statusStep.length - 1 && (
              <div
                className={`h-20 w-[2px] ${
                  index < currentStep ? "bg-teal-500" : "bg-gray-300"
                }`}
              ></div>
            )}
          </div>

          <div className="ml-2 w-full">
            <div
              className={`${
                step.value === orderStatus
                  ? "bg-primary-color p-2 text-white font-medium rounded-md -translate-y-3"
                  : ""
              } ${
                orderStatus === "CANCELLED" && step.value === orderStatus
                  ? "bg-red-500"
                  : ""
              } w-full`}
            >
              <p>{step.name}</p>
              <p
                className={`${
                  step.value === orderStatus ? "text-gray-200" : "text-gray-500"
                } text-xs`}
              >
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </Box>
  );
};

export default OrderStepper;