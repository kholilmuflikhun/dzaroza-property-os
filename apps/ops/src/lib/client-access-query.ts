type ClientAccessActor = {
  id: string;
  organizationId: string;
  role: string;
};

export function authorizedClientWhere(actor: ClientAccessActor) {
  const tenant = { organizationId: actor.organizationId };
  if (actor.role === "OWNER" || actor.role === "ADMIN" || actor.role === "FINANCE") {
    return tenant;
  }
  if (actor.role === "PROJECT_MANAGER") {
    return {
      ...tenant,
      projects: {
        some: {
          assignments: {
            some: {
              organizationId: actor.organizationId,
              membershipId: actor.id,
              assignmentRole: "PROJECT_MANAGER",
              status: "ACTIVE",
            },
          },
        },
      },
    };
  }
  if (actor.role === "STAFF") {
    return {
      ...tenant,
      projects: {
        some: {
          assignments: {
            some: {
              organizationId: actor.organizationId,
              membershipId: actor.id,
              assignmentRole: { in: ["CONTRIBUTOR", "VIEWER"] },
              status: "ACTIVE",
            },
          },
        },
      },
    };
  }
  if (actor.role === "SALES") {
    return {
      ...tenant,
      salesAccesses: {
        some: { organizationId: actor.organizationId, membershipId: actor.id, status: "ACTIVE" },
      },
    };
  }
  if (actor.role === "CLIENT") {
    return {
      ...tenant,
      portalAccesses: {
        some: { organizationId: actor.organizationId, membershipId: actor.id, status: "ACTIVE" },
      },
    };
  }
  return { ...tenant, id: "__no_client_access__" };
}
