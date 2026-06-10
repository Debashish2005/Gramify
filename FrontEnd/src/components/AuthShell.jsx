import Brand from "./Brand";

export default function AuthShell({ title, description, children, footer }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#17181c] lg:block">
        <img
          src="/img1.jpg"
          alt="Gramify community preview"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Brand to="/login" light />
          <div className="max-w-xl pb-8 text-white">
            <p className="mb-4 text-sm font-bold uppercase text-white/70">
              Share what matters
            </p>
            <h2 className="text-4xl font-black leading-tight xl:text-5xl">
              A better place for the people and moments you care about.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
              Follow friends, react with context, and keep conversations moving
              without losing the moments in between.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col bg-white px-5 py-6 dark:bg-[#0c0d10] sm:px-10 lg:px-12 xl:px-20">
        <div className="lg:hidden">
          <Brand to="/login" compact />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <p className="eyebrow mb-3">Gramify account</p>
            <h1 className="text-3xl font-black text-[#17181c] dark:text-white sm:text-4xl">
              {title}
            </h1>
            {description && <p className="subtle-text mt-3 leading-6">{description}</p>}
          </div>
          {children}
          {footer && <div className="mt-8">{footer}</div>}
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-black/[0.08] pt-5 text-xs text-zinc-500 dark:border-white/[0.09]">
          <span>Gramify</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Help</span>
        </footer>
      </section>
    </main>
  );
}
