import Link from "next/link";
import Image from "next/image";

export function DirectoryTile({
  href,
  title,
  cover,
  formLabel,
  children,
  footer,
  action,
}: {
  href: string;
  title: string;
  cover?: string;
  formLabel: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  action: string;
}) {
  return (
    <article className="directory-tile">
      <Link href={href} className="tile-cover" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <Image src={cover} width={480} height={300} unoptimized alt="" />
        ) : (
          <span>{formLabel}</span>
        )}
      </Link>
      <div className="tile-body">
        <h2>
          <Link href={href}>{title}</Link>
        </h2>
        {children}
        <div className="tile-footer">{footer}</div>
        <Link className="tile-action" href={href}>{action} <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}
