
import type { SVGProps } from "react";

const FlowerIconTwo = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="none" />
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
    <path d="M12 2c-3.03 0-5.77 1.24-7.78 3.22" fill="none" stroke="currentColor" strokeWidth={1.5}/>
    <path d="M22 12c0-3.03-1.24-5.77-3.22-7.78" fill="none" stroke="currentColor" strokeWidth={1.5}/>
    <path d="M12 22c3.03 0 5.77-1.24 7.78-3.22" fill="none" stroke="currentColor" strokeWidth={1.5}/>
    <path d="M2 12c0 3.03 1.24 5.77 3.22 7.78" fill="none" stroke="currentColor" strokeWidth={1.5}/>
  </svg>
);

export default FlowerIconTwo;
