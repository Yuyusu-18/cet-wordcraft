import Link from "next/link";
import { ReactNode } from "react";

interface ContentCardProps {
  title: string;
  subtitle?: string;
  tags?: string[];
  href: string;
  children?: ReactNode;
  badge?: string;
}

export default function ContentCard({
  title,
  subtitle,
  tags,
  href,
  children,
  badge,
}: ContentCardProps) {
  return (
    <Link href={href} className="card block hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-warm-600 transition-colors">
          {title}
        </h3>
        {badge && (
          <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
      )}
      {children}
      {tags && tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}