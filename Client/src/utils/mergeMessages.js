export function mergeMessage(current, incoming) {
  if (current?.deletedAt && !incoming.deletedAt) return current;
  if (incoming.deletedAt)
    return {
      ...current,
      ...incoming,
      body: "",
      voiceMime: null,
      voiceDurationMs: null,
      reactions: [],
      savedBy: [],
      saved: false,
    };
  return { ...current, ...incoming };
}
export function mergeMessages(current, incoming) {
  const rows = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming)
    rows.set(message.id, mergeMessage(rows.get(message.id), message));
  return [...rows.values()].sort(
    (a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id),
  );
}
