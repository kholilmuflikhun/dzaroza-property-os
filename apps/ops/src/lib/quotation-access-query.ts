type QuotationAccessActor = {
  id: string;
  organizationId: string;
  role: string;
};

import type { Prisma } from "@dzaroza/database";

export function authorizedQuotationWhere(actor: QuotationAccessActor): Prisma.QuotationWhereInput {
  const tenant = { organizationId: actor.organizationId };
  if (actor.role === "OWNER" || actor.role === "ADMIN" || actor.role === "FINANCE") {
    return tenant;
  }
  if (actor.role === "PROJECT_MANAGER") {
    return {
      ...tenant,
      project: {
        assignments: {
          some: {
            organizationId: actor.organizationId,
            membershipId: actor.id,
            assignmentRole: "PROJECT_MANAGER",
            status: "ACTIVE",
          },
        },
      },
    };
  }
  if (actor.role === "SALES") {
    return {
      ...tenant,
      client: {
        salesAccesses: {
          some: { organizationId: actor.organizationId, membershipId: actor.id, status: "ACTIVE" },
        },
      },
    };
  }
  return { ...tenant, id: "__no_quotation_access__" };
}
