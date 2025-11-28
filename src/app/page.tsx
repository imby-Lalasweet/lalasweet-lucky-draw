import { LuckyDraw } from "@/components/LuckyDraw";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050510]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Game Component */}
      <LuckyDraw />
    </main>
  );
}
