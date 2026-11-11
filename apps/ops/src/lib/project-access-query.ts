type ProjectAccessActor = {
  id: string;
  organizationId: string;
  role: string;
};

export function authorizedProjectWhere(actor: ProjectAccessActor) {
  const tenant = { organizationId: actor.organizationId };
  if (actor.role === "OWNER" || actor.role === "ADMIN" || actor.role === "FINANCE") {
    return tenant;
  }
  if (actor.role === "PROJECT_MANAGER") {
    return {
      ...tenant,
      assignments: {
        some: {
          organizationId: actor.organizationId,
          membershipId: actor.id,
          assignmentRole: "PROJECT_MANAGER",
          status: "ACTIVE",
        },
      },
    };
  }
  if (actor.role === "STAFF") {
    return {
      ...tenant,
      assignments: {
        some: {
          organizationId: actor.organizationId,
          membershipId: actor.id,
          assignmentRole: { in: ["CONTRIBUTOR", "VIEWER"] },
          status: "ACTIVE",
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
  if (actor.role === "CLIENT") {
    return {
      ...tenant,
      client: {
        portalAccesses: {
          some: { organizationId: actor.organizationId, membershipId: actor.id, status: "ACTIVE" },
        },
      },
    };
  }
  return { ...tenant, id: "__no_project_access__" };
}
