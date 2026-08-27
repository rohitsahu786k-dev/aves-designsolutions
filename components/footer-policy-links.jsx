"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function FooterPolicyLinks() {
  const [policies, setPolicies] = useState([]);
  useEffect(() => {
    fetch("/api/policies").then((response) => response.ok ? response.json() : { policies: [] }).then((data) => setPolicies(data.policies || [])).catch(() => setPolicies([]));
  }, []);
  if (!policies.length) return null;
  return <>{policies.map((page) => <Link href={page.href} key={page.id}>{page.label}</Link>)}</>;
}
