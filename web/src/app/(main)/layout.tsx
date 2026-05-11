import Sidebar from "@/components/layout/Sidebar";
import AICompanion from "@/components/ai-companion/AICompanion";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
      <AICompanion />
    </div>
  );
}
