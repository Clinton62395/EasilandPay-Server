// utils/paymentPlan.js
export const calculateInstallments = (totalAmount, planType) => {
  const plans = {
    weekly: { count: 52, days: 7 },
    monthly: { count: 12, days: 30 },
    quarterly: { count: 4, days: 90 },
    "bi-annual": { count: 2, days: 180 },
    yearly: { count: 1, days: 365 },
    outright: { count: 1, days: 0 },
  };

  const plan = plans[planType];
  const installmentAmount = Math.floor(totalAmount / plan.count);
  const installments = [];

  for (let i = 0; i < plan.count; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + plan.days * i);

    installments.push({
      dueDate,
      amount:
        i === plan.count - 1
          ? totalAmount - installmentAmount * (plan.count - 1)
          : installmentAmount,
      status: "PENDING",
    });
  }

  return installments;
};
