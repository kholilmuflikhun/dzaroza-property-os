import { describe, expect, it } from "vitest";
import { authorizedProjectWhere } from "./project-access-query";

const actor = (role: string) => ({ id: "member-a", organizationId: "org-a", role });

describe("authorized project list scopes", () => {
  it("allows Owner, Admin, and Finance to read tenant projects", () => {
    for (const role of ["OWNER", "ADMIN", "FINANCE"]) {
      expect(authorizedProjectWhere(actor(role))).toEqual({ organizationId: "org-a" });
    }
  });

  it("limits Project Managers to their active managed projects", () => {
    expect(authorizedProjectWhere(actor("PROJECT_MANAGER"))).toEqual({
      organizationId: "org-a",
      assignments: { some: {
        organizationId: "org-a", membershipId: "member-a",
        assignmentRole: "PROJECT_MANAGER", status: "ACTIVE",
      } },
    });
  });

  it("limits Staff to active contributor or viewer assignments", () => {
    expect(authorizedProjectWhere(actor("STAFF"))).toEqual({
      organizationId: "org-a",
      assignments: { some: {
        organizationId: "org-a", membershipId: "member-a",
        assignmentRole: { in: ["CONTRIBUTOR", "VIEWER"] }, status: "ACTIVE",
      } },
    });
  });

  it("requires active client grants for Sales and Client Portal", () => {
    expect(authorizedProjectWhere(actor("SALES"))).toEqual({
      organizationId: "org-a",
      client: { salesAccesses: { some: {
        organizationId: "org-a", membershipId: "member-a", status: "ACTIVE",
      } } },
    });
    expect(authorizedProjectWhere(actor("CLIENT"))).toEqual({
      organizationId: "org-a",
      client: { portalAccesses: { some: {
        organizationId: "org-a", membershipId: "member-a", status: "ACTIVE",
      } } },
    });
  });

  it("returns an empty identifier scope for unknown roles", () => {
    expect(authorizedProjectWhere(actor("UNKNOWN"))).toEqual({
      organizationId: "org-a", id: "__no_project_access__",
    });
  });
});
