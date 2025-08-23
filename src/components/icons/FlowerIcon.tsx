import type { SVGProps } from "react";

const FlowerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 7.5a4.5 4.5 0 1 1 -4.5 4.5A4.5 4.5 0 0 1 12 7.5z"/>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5A4.5 4.5 0 0 1 12 7.5z" transform="rotate(60 12 12)"/>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5A4.5 4.5 0 0 1 12 7.5z" transform="rotate(120 12 12)"/>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5A4.5 4.5 0 0 1 12 7.5z" transform="rotate(180 12 12)"/>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5A4.5 4.5 0 0 1 12 7.5z" transform="rotate(240 12 12)"/>
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5A4.5 4.5 0 0 1 12 7.5z" transform="rotate(300 12 12)"/>
    <circle cx="12" cy="12" r="2.5" fill="white"/>
  </svg>
);

export default FlowerIcon;
