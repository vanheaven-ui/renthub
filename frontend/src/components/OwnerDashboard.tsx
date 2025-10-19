import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { JSX } from "react";

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: JSX.Element;
  label: string;
  value: string | number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100"
  >
    {icon}
    <p className="text-3xl font-bold text-purple-700">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </motion.div>
);

export default function OwnerDashboard({
  userName,
  totalEarnings,
  bookingsThisMonth,
  activeListings,
}: {
  userName: string;
  totalEarnings: number;
  bookingsThisMonth: number;
  activeListings: number;
}) {
  return (
    <div>
      <h1 className="text-4xl font-extrabold text-purple-800 mb-2">
        Welcome back, <span className="text-pink-600">{userName}</span>!
      </h1>
      <p className="text-lg text-gray-600 mb-8">Your Performance Dashboard</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<CurrencyDollarIcon className="w-10 h-10 text-pink-500" />}
          label="Total Earnings"
          value={`UGX ${totalEarnings.toLocaleString()}`}
        />
        <StatCard
          icon={<CalendarDaysIcon className="w-10 h-10 text-blue-500" />}
          label="Bookings This Month"
          value={bookingsThisMonth}
        />
        <StatCard
          icon={<HomeIcon className="w-10 h-10 text-purple-500" />}
          label="Active Listings"
          value={activeListings}
        />
      </div>
    </div>
  );
}
