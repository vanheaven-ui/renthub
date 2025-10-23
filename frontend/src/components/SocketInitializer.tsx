"use client";

import { initSocket } from "@/lib/socket";
import { useEffect } from "react";

export default function SocketInitializer() {
  useEffect(() => {
    initSocket();
  }, []);

  return null;
}
