import { PageHeader } from "@/components/PageHeader";
import { KeywordManager } from "./KeywordManager";
import { ResumeManager } from "./ResumeManager";
import { PreferencesForm } from "./PreferencesForm";
import { CompanyBoardManager } from "./CompanyBoardManager";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Tune what we look for, what we know about you, and how jobs are scored."
      />
      <div className="px-8 py-8 max-w-5xl mx-auto space-y-10">
        <section>
          <SectionTitle eyebrow="01" title="Keywords" subtitle="Each keyword is expanded by Claude into related job titles we'll search for." />
          <KeywordManager />
        </section>
        <section>
          <SectionTitle eyebrow="02" title="Your resume" subtitle="Upload your latest resume PDF — we extract the text to power tailored applications." />
          <ResumeManager />
        </section>
        <section>
          <SectionTitle
            eyebrow="03"
            title="Company boards"
            subtitle="Track jobs from specific companies via Greenhouse, Lever, and Ashby — fully free, no API key needed."
          />
          <CompanyBoardManager />
        </section>
        <section>
          <SectionTitle eyebrow="04" title="What you're looking for" subtitle="These preferences feed every job's fit score." />
          <PreferencesForm />
        </section>
      </div>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">{eyebrow}</div>
      <h2 className="font-serif text-2xl font-semibold text-ink-primary mt-1">{title}</h2>
      {subtitle ? <p className="text-sm text-ink-secondary mt-1">{subtitle}</p> : null}
    </div>
  );
}
