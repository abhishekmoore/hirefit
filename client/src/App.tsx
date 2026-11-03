import { useEffect, useState, type FormEvent } from "react";
import { createScreen, deleteScreen, getHealth, listScreens } from "./api";
import { sampleJob, sampleResume } from "./sample";
import type { HealthInfo, ScreenRecord } from "./types";

export function App() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [name, setName] = useState("Aisha Raman");
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const active = screens.find((screen) => screen.id === activeId) ?? null;

  useEffect(() => {
    void (async () => {
      try {
        const [nextHealth, history] = await Promise.all([getHealth(), listScreens()]);
        setHealth(nextHealth);
        setScreens(history);
        setActiveId(history[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reach the API.");
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const screen = await createScreen({ candidateName: name, resumeText, jobText });
      setScreens((current) => [screen, ...current]);
      setActiveId(screen.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Screen failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError("");
    try {
      await deleteScreen(id);
      setScreens((current) => current.filter((screen) => screen.id !== id));
      setActiveId((current) => (current === id ? null : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="mark">HireFit</p>
          <h1>Does this resume actually face the role?</h1>
        </div>
        <p className="status">
          {health
            ? `${health.ai === "model" ? health.model : "offline overlap"} · ${health.store} store`
            : "checking api"}
        </p>
      </header>

      <main className="layout">
        <form className="desk" onSubmit={onSubmit}>
          <div className="row">
            <label>
              Candidate
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
            </label>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setResumeText(sampleResume);
                setJobText(sampleJob);
                setName("Aisha Raman");
              }}
            >
              Load sample
            </button>
          </div>
          <label>
            Resume
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste the resume. The scorer only uses this text."
              rows={12}
            />
          </label>
          <label>
            Job description
            <textarea
              value={jobText}
              onChange={(event) => setJobText(event.target.value)}
              placeholder="Paste the role. Skills that are not written here cannot be required."
              rows={12}
            />
          </label>
          <div className="row end">
            <p className="hint">Both texts need at least 80 characters. Nothing is sent to a model unless an API key is set.</p>
            <button type="submit" disabled={busy}>
              {busy ? "Reading…" : "Score fit"}
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>

        <section className="result" aria-live="polite">
          {active ? <Result screen={active} /> : <Empty />}
        </section>
      </main>

      <aside className="history">
        <h2>Recent screens</h2>
        {screens.length === 0 ? <p className="hint">Nothing saved yet.</p> : null}
        <ul>
          {screens.map((screen) => (
            <li key={screen.id} className={screen.id === activeId ? "on" : ""}>
              <button type="button" onClick={() => setActiveId(screen.id)}>
                <strong>{screen.candidateName}</strong>
                <span>{screen.result.score}</span>
              </button>
              <button type="button" className="text" onClick={() => void onDelete(screen.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Result({ screen }: { screen: ScreenRecord }) {
  const { result } = screen;
  return (
    <>
      <div className="scoreline">
        <p className="score">{result.score}</p>
        <div>
          <p className="eyebrow">{result.source === "model" ? `Model · ${result.model}` : "Offline overlap · not a model"}</p>
          <h2>{screen.candidateName}</h2>
          <p>{result.summary}</p>
        </div>
      </div>
      <div className="cols">
        <Skill title="In both" items={result.matchedSkills} tone="good" />
        <Skill title="In the role only" items={result.missingSkills} tone="miss" />
        <Skill title="Risks" items={result.risks} tone="risk" />
      </div>
      {result.rewrittenBullets.length > 0 ? (
        <div className="bullets">
          <h3>Bullets, faced at this role</h3>
          <ul>
            {result.rewrittenBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function Skill({ title, items, tone }: { title: string; items: string[]; tone: "good" | "miss" | "risk" }) {
  return (
    <div className={`pile ${tone}`}>
      <h3>{title}</h3>
      {items.length === 0 ? <p>None.</p> : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <p className="eyebrow">No screen yet</p>
      <h2>Paste both texts, or load the sample.</h2>
      <p>A match is only a match if the resume says it. The offline check is a skill overlap, not a hiring decision.</p>
    </div>
  );
}
