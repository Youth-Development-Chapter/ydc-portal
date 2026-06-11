import type { Metadata } from "next";
import { Poppins, Noto_Nastaliq_Urdu } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import CheckInListener from "@/components/CheckInListener";
import "./globals.css";

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-noto-nastaliq",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YDC",
  description: "Youth Development Center",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative font-sans">
        {children}

        <Toaster position="top-right" richColors />
        {user && <CheckInListener userId={user.id} />}
      </body>
    </html>
  );
}
