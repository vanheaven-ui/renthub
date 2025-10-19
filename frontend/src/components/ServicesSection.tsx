"use client";

import { motion } from "framer-motion";
import {
  SparklesIcon,
  CreditCardIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

const services = [
  {
    title: "AI Chat Assistant",
    desc: "Get 24/7 AI-powered assistance for bookings, check-ins, and local guidance.",
    icon: <SparklesIcon className="w-12 h-12 text-yellow-400" />,
    color: "bg-gradient-to-tr from-yellow-100 to-yellow-300",
  },
  {
    title: "Mobile Money Payments",
    desc: "Pay securely using MTN MoMo or Airtel Money — fast, reliable, and trusted.",
    icon: <CreditCardIcon className="w-12 h-12 text-purple-500" />,
    color: "bg-gradient-to-tr from-purple-100 to-purple-300",
  },
  {
    title: "In-App Chat",
    desc: "Communicate directly with property owners and guests using our real-time chat feature.",
    icon: (
      <ChatBubbleBottomCenterTextIcon className="w-12 h-12 text-blue-400" />
    ),
    color: "bg-gradient-to-tr from-blue-100 to-blue-300",
  },
];

const ServicesSection = () => {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      {/* Background Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-pink-200 opacity-20 -top-40 -left-40 rotate-45"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-200 opacity-20 -bottom-40 -right-20 rotate-12"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-300 opacity-30 top-20 right-10 rotate-90"></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-12">
          What Makes RentHub Unique
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-16">
          Explore the cutting-edge features that make our platform the easiest
          and safest way to find your perfect stay in Uganda.
        </p>

        {/* Unique diagonal layout */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24 relative">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className={`relative w-72 md:w-80 p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition duration-300 cursor-pointer ${s.color}`}
              style={{ zIndex: services.length - i }}
            >
              {/* Rotated background card shape */}
              <div className="absolute -inset-2 bg-white/10 rounded-3xl rotate-6 -z-10"></div>

              <div className="flex flex-col items-center text-center gap-4">
                {s.icon}
                <h3 className="text-xl font-bold text-purple-900">{s.title}</h3>
                <p className="text-gray-700">{s.desc}</p>
              </div>

              {/* Connecting lines/arrows */}
              {i < services.length - 1 && (
                <div className="hidden md:block absolute right-[-80px] top-1/2 w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rotate-0"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
