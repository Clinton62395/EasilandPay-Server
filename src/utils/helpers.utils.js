export const propertyPopulate = [
  { path: "ownerId", select: "firstName lastName companyInfo email" },
  { path: "assignedRealtorId", select: "firstName lastName email phoneNumber" },
  { path: "reservedBy", select: "firstName lastName email" },
  { path: "approvedBy", select: "firstName lastName" },
];

export const editorPopulate = [
  { path: "AuthorId", select: "firstName lastName email" },
];
