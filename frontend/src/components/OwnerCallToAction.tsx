"use client";

import { SparklesIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion } from "framer-motion";

const MotionLink = motion(Link);

const OwnerCallToAction = () => (
  <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
    <div className="max-w-6xl mx-auto text-center relative z-10">
      <SparklesIcon className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
        Become a <span className="text-pink-300">RentHub Host</span>
      </h2>
      <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
        Have a villa, apartment, or cottage in Uganda? List your property with
        us and start generating passive income today.
      </p>

      {/* Modern Link without legacyBehavior */}
      <MotionLink
        href="/register"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-blue-900 bg-yellow-400 rounded-full shadow-2xl hover:bg-yellow-300 transition-colors duration-300"
      >
        Start Earning Now <ArrowRightIcon className="w-5 h-5 ml-2" />
      </MotionLink>
    </div>

    {/* Abstract Background Shapes */}
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute w-[300px] h-[300px] bg-white rounded-full -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-white rounded-full -bottom-40 -right-40"></div>
    </div>
  </section>
);

export default OwnerCallToAction;
