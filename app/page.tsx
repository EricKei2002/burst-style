import Hero from "./components/Hero";
import Projects from "./components/Projects";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-5xl flex-col gap-24 px-6 py-24 sm:px-12 lg:px-16">
        <Hero />
        <Projects />
      </main>
    </div>
  );
}
