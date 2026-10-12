import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import ConsentGate from "@/components/ConsentGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Pet from "@/components/Pet";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Flashly – AI flashcards & quizzes from your notes",
    template: "%s · Flashly",
  },
  description:
    "Paste your notes or type a topic and Flashly builds flashcards, quizzes and a match game in seconds. Free, no account needed.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8ee" },
    { media: "(prefers-color-scheme: dark)", color: "#130f26" },
  ],
};

// Runs before first paint so the saved (or system) theme and accent never flash.
const themeScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem('flashly-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;var a=localStorage.getItem('flashly-accent');if(a)d.dataset.accent=a}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Pet />
          <ConsentGate />
        </AuthProvider>
      </body>
    </html>
  );
}
