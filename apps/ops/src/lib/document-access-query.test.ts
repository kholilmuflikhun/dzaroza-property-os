import { describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@dzaroza/database", () => ({ prisma: { document: { findFirst } } }));

import { authorizedDocumentWhere, canManageDocument } from "./document-access-query";

const actor = (role: string) => ({ id: "member-a", userId: "user-a", organizationId: "org-a", role });

describe("authorized document list scopes", () => {
  it("grants Owner and Admin organization-wide access", () => {
    expect(authorizedDocumentWhere(actor("OWNER"))).toEqual({
      organizationId: "org-a", status: "AVAILABLE", deletedAt: null,
    });
    expect(authorizedDocumentWhere(actor("ADMIN"))).toEqual({
      organizationId: "org-a", status: "AVAILABLE", deletedAt: null,
    });
  });

  it("limits Finance to all organization invoices", () => {
    expect(authorizedDocumentWhere(actor("FINANCE"))).toEqual(expect.objectContaining({
      organizationId: "org-a",
      OR: [{ invoiceId: { not: null } }],
    }));
  });

  it("limits Project Managers to active PM assignments and linked invoice scopes", () => {
    const where = authorizedDocumentWhere(actor("PROJECT_MANAGER"));
    expect(where).toEqual(expect.objectContaining({
      OR: expect.arrayContaining([
        { project: { assignments: { some: { organizationId: "org-a", membershipId: "member-a", assignmentRole: "PROJECT_MANAGER", status: "ACTIVE" } } } },
        { invoice: { project: { assignments: { some: { organizationId: "org-a", membershipId: "member-a", assignmentRole: "PROJECT_MANAGER", status: "ACTIVE" } } } } },
      ]),
    }));
  });

  it("limits Staff to assigned project files and uploader-owned unlinked files", () => {
    expect(authorizedDocumentWhere(actor("STAFF"))).toEqual(expect.objectContaining({
      OR: [
        { projectId: { not: null }, invoiceId: null, project: { assignments: { some: { organizationId: "org-a", membershipId: "member-a", assignmentRole: { in: ["CONTRIBUTOR", "VIEWER"] }, status: "ACTIVE" } } } },
        { projectId: null, invoiceId: null, uploadedById: "user-a" },
      ],
    }));
  });

  it("requires explicit client grants for Sales and Client Portal reads", () => {
    const sales = authorizedDocumentWhere(actor("SALES"));
    const client = authorizedDocumentWhere(actor("CLIENT"));
    expect(JSON.stringify(sales)).toContain("salesAccesses");
    expect(JSON.stringify(client)).toContain("portalAccesses");
    expect(sales).not.toEqual(client);
  });

  it("denies unknown roles by returning an empty scope", () => {
    expect(authorizedDocumentWhere(actor("UNKNOWN"))).toEqual(expect.objectContaining({ OR: [] }));
  });
});

describe("document action authorization", () => {
  const document = (overrides: Record<string, unknown> = {}) => ({
    id: "doc-a",
    uploadedById: "user-a",
    projectId: null,
    invoiceId: null,
    project: null,
    invoice: null,
    ...overrides,
  });

  it("grants Finance all actions on organization invoice documents", async () => {
    findFirst.mockResolvedValue(document({ invoiceId: "invoice-a" }));
    for (const action of ["READ", "UPLOAD", "FINALIZE", "DOWNLOAD"] as const) {
      await expect(canManageDocument(actor("FINANCE"), "doc-a", action)).resolves.toBe(true);
    }
  });

  it("limits Project Manager invoice documents to read and download on active assigned projects", async () => {
    findFirst.mockResolvedValue(document({
      invoiceId: "invoice-a",
      invoice: { project: { assignments: [{ id: "assignment-a" }], client: { salesAccesses: [], portalAccesses: [] } }, quotation: { client: { salesAccesses: [], portalAccesses: [] } } },
    }));
    await expect(canManageDocument(actor("PROJECT_MANAGER"), "doc-a", "READ")).resolves.toBe(true);
    await expect(canManageDocument(actor("PROJECT_MANAGER"), "doc-a", "DOWNLOAD")).resolves.toBe(true);
    await expect(canManageDocument(actor("PROJECT_MANAGER"), "doc-a", "UPLOAD")).resolves.toBe(false);
    await expect(canManageDocument(actor("PROJECT_MANAGER"), "doc-a", "FINALIZE")).resolves.toBe(false);
  });

  it("grants Sales read-only access only with an active client grant", async () => {
    findFirst.mockResolvedValue(document({
      projectId: "project-a",
      project: { assignments: [], client: { salesAccesses: [{ id: "grant-a" }], portalAccesses: [] } },
    }));
    await expect(canManageDocument(actor("SALES"), "doc-a", "READ")).resolves.toBe(true);
    await expect(canManageDocument(actor("SALES"), "doc-a", "DOWNLOAD")).resolves.toBe(false);
  });

  it("limits Staff unlinked access to their own uploads", async () => {
    findFirst.mockResolvedValue(document({ uploadedById: "user-a" }));
    await expect(canManageDocument(actor("STAFF"), "doc-a", "READ")).resolves.toBe(true);
    await expect(canManageDocument(actor("STAFF"), "doc-a", "UPLOAD")).resolves.toBe(true);
    await expect(canManageDocument(actor("STAFF"), "doc-a", "FINALIZE")).resolves.toBe(true);
    findFirst.mockResolvedValue(document({ uploadedById: "user-b" }));
    await expect(canManageDocument(actor("STAFF"), "doc-a", "READ")).resolves.toBe(false);
  });

  it("denies unlinked document access to Finance, Project Manager, Sales, and Client", async () => {
    findFirst.mockResolvedValue(document({ uploadedById: "user-a" }));
    for (const role of ["FINANCE", "PROJECT_MANAGER", "SALES", "CLIENT"]) {
      await expect(canManageDocument(actor(role), "doc-a", "READ")).resolves.toBe(false);
      await expect(canManageDocument(actor(role), "doc-a", "UPLOAD")).resolves.toBe(false);
    }
  });

  it("returns false for missing documents before evaluating any role", async () => {
    findFirst.mockResolvedValue(null);
    await expect(canManageDocument(actor("OWNER"), "missing", "READ")).resolves.toBe(false);
  });
});
