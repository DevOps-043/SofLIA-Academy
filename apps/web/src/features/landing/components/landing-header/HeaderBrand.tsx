import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function HeaderBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative h-10 w-10 lg:h-12 lg:w-12"
      >
        <Image src="/Logo.png" alt="SofLIA Academy" fill className="object-contain" priority />
      </motion.div>
      <div className="flex items-center gap-2 text-xl font-bold text-primary dark:text-white lg:text-2xl">
        <span>SofLIA</span>
        <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          Academy
        </span>
      </div>
    </Link>
  );
}
