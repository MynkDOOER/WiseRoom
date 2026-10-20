export function getMessageLinks(text) {
  const links = [];
  for (const match of text
    .replace(/```[\s\S]*?```/g, "")
    .matchAll(/https?:\/\/[^\s<>"']+/g)) {
    try {
      const url = new URL(match[0].replace(/[.,!?;:]+$/, ""));
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        links.some((item) => item.href === url.href)
      )
        continue;
      let title =
        url.pathname !== "/"
          ? url.pathname.slice(1).replace(/[-_]/g, " ")
          : url.hostname;
      try {
        title = decodeURI(title);
      } catch {
        /* A malformed percent escape is still safe to display as text. */
      }
      links.push({ href: url.href, hostname: url.hostname, title });
      if (links.length === 2) break;
    } catch {
      /* Only valid HTTP links become cards. */
    }
  }
  return links;
}
