"use client";

import {
  CurrencyDollarIcon,
  HomeIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";

interface OwnerDashboardCTAProps {
  totalEarnings: number;
  bookingsThisMonth: number;
  activeListings: number;
}

const OwnerDashboardCTA = ({
  totalEarnings,
  bookingsThisMonth,
  activeListings,
}: OwnerDashboardCTAProps) => {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-purple-700 to-blue-700 relative z-10 overflow-hidden text-white">
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Welcome Back, <span className="text-yellow-300">Host!</span>
        </h2>
        <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-12">
          Here’s a quick summary of your property performance this month.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            className="bg-white/20 p-6 rounded-2xl shadow-lg flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <CurrencyDollarIcon className="w-10 h-10 text-yellow-300 mb-2" />
            <p className="text-3xl font-bold">{`UGX ${totalEarnings.toLocaleString()}`}</p>
            <p className="text-sm mt-1">Total Earnings</p>
          </motion.div>

          <motion.div
            className="bg-white/20 p-6 rounded-2xl shadow-lg flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CalendarDaysIcon className="w-10 h-10 text-yellow-300 mb-2" />
            <p className="text-3xl font-bold">{bookingsThisMonth}</p>
            <p className="text-sm mt-1">Bookings This Month</p>
          </motion.div>

          <motion.div
            className="bg-white/20 p-6 rounded-2xl shadow-lg flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <HomeIcon className="w-10 h-10 text-yellow-300 mb-2" />
            <p className="text-3xl font-bold">{activeListings}</p>
            <p className="text-sm mt-1">Active Listings</p>
          </motion.div>
        </div>

        <Link href="/my-listings" passHref legacyBehavior>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block mt-12 px-10 py-4 bg-yellow-400 text-blue-900 font-bold rounded-full shadow-2xl hover:bg-yellow-300 transition-colors"
          >
            Manage My Listings
          </motion.a>
        </Link>
      </div>
    </section>
  );
};

export default OwnerDashboardCTA;
