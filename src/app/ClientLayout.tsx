'use client';

import AuthProvider from "@/lib/auth/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
} 