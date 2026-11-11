import type { Prisma } from "@dzaroza/database";

type FinanceAccessActor = {
  id: string;
  organizationId: string;
  role: string;
};

function assignedProject(actor: FinanceAccessActor) {
  return {
    assignments: {
      some: {
        organizationId: actor.organizationId,
        membershipId: actor.id,
        assignmentRole: "PROJECT_MANAGER" as const,
        status: "ACTIVE" as const,
      },
    },
  };
}

export function authorizedInvoiceWhere(actor: FinanceAccessActor): Prisma.InvoiceWhereInput {
  const tenant = { organizationId: actor.organizationId };
  if (actor.role !== "PROJECT_MANAGER") return tenant;
  return { ...tenant, project: assignedProject(actor) };
}

export function authorizedPaymentWhere(actor: FinanceAccessActor): Prisma.PaymentTransactionWhereInput {
  const tenant = { organizationId: actor.organizationId, invoiceId: { not: null } };
  if (actor.role !== "PROJECT_MANAGER") return tenant;
  return { ...tenant, invoice: { project: assignedProject(actor) } };
}

export function authorizedExpenseWhere(actor: FinanceAccessActor): Prisma.ExpenseWhereInput {
  const tenant = { organizationId: actor.organizationId };
  if (actor.role !== "PROJECT_MANAGER") return tenant;
  return { ...tenant, project: assignedProject(actor) };
}
