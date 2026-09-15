import Image from "next/image";

/** Decorative brand mark; pair with a named home link (e.g. wordmark). */
export default function Brand({ size = 28 }: { size?: number }) {
  return (
    <Image src="/icon.svg" alt="" height={size} width={size} aria-hidden />
  );
}
