export function messageWindow(current, incoming) {
  const ids = new Set(current.map((row) => row.id)),
    boundary = current.at(-1);
  return incoming.filter(
    (row) =>
      ids.has(row.id) ||
      !boundary ||
      new Date(row.createdAt) > new Date(boundary.createdAt) ||
      (row.createdAt === boundary.createdAt && row.id > boundary.id),
  );
}
