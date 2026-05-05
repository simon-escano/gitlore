export function Footer() {
  return (
    <footer className="border-t border-(--color-border) py-6 text-center text-sm text-(--color-text-muted)">
      <p>
        Built with{" "}
        <a
          href="https://github.com/simon-escano/gitlore"
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--color-accent) hover:underline"
        >
          Gitlore
        </a>
        {" "}— Powered by Cerebras Cloud & Cloudflare Workers
      </p>
    </footer>
  );
}
