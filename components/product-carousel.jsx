"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ProductCard } from "@/components/product-card";

export function ProductCarousel({ products = [] }) {
  const trackRef = useRef(null);
  const move = (direction) => trackRef.current?.scrollBy({ left: direction * trackRef.current.clientWidth * 0.86, behavior: "smooth" });
  if (!products.length) return null;
  return <div className="product-carousel"><div className="product-carousel-controls"><button onClick={() => move(-1)} aria-label="Previous products"><ChevronLeft size={18} /></button><button onClick={() => move(1)} aria-label="Next products"><ChevronRight size={18} /></button></div><div className="product-carousel-track" ref={trackRef}>{products.map((product) => <div className="product-carousel-slide" key={product.id}><ProductCard product={product} /></div>)}</div></div>;
}
