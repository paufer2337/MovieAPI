import { useRef } from "react";
import { Link } from "react-router-dom";
import { usePageMetadata } from "../hooks/usePageMetadata";

type RouteMessagePageProps = {
  message: string;
  title: string;
};

export function RouteMessagePage({ title, message }: RouteMessagePageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  usePageMetadata(`${title} | CinematheQue`, headingRef);

  return (
    <main className="route-message-page">
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      <p>{message}</p>
      <Link to="/">Back to the catalog</Link>
    </main>
  );
}
