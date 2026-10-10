import { useMemo, useState } from "react";
import { BookOpen, Play, ExternalLink, CheckCircle2, PanelsTopLeft, Code2, LockKeyhole } from "lucide-react";

export type Tutorial = {
  id: string; title: string; by: string; minutes: string; videoId: string; start: number;
  category: "C# basics" | "WinForms" | "Full application";
  topic: string; exercise: string; route: string;
  steps: readonly string[];
};
export const tutorials: readonly Tutorial[] = [
  {
    id: "csharp-fundamentals", title: "C# foundations — variables, methods, classes", by: "freeCodeCamp / Mike Dane",
    minutes: "4h 30m", videoId: "GhQdlIFylQ8", start: 0, category: "C# basics",
    topic: "Build a foundation before writing form events.",
    exercise: "Make a method that checks whether a number is positive, then test edge cases in Code Lab.",
    route: "playground", steps: ["Watch how variables and functions work", "Write and run C# yourself", "Explain why incorrect inputs fail"]
  },
  {
    id: "winforms-control", title: "Visual Studio WinForms controls and events", by: "CodeWithSalar",
    minutes: "3h+", videoId: "oOnyVPqssjg", start: 0, category: "WinForms",
    topic: "Labels, textboxes, buttons, ComboBox, ListBox, DataGridView-like tables, events and MessageBox.",
    exercise: "In WinForms add a TextBox, Label and Button. Double-click the button to create a Click handler and show a MessageBox.",
    route: "designer", steps: ["Watch the control demonstration", "Recreate controls in CodeQuest's designer", "Run the form and test invalid inputs"]
  },
  {
    id: "winforms-practice", title: "Calculator and form events — hands-on chapter", by: "CodeWithSalar",
    minutes: "Project chapter", videoId: "oOnyVPqssjg", start: 3696, category: "WinForms",
    topic: "Apply events and numeric validation instead of just copying a demo.",
    exercise: "Build a calculator that rejects missing or invalid numbers. Run it, break it deliberately, then fix your code.",
    route: "designer", steps: ["Predict the result before pressing Calculate", "Implement and run the form", "Try divide-by-zero and empty-input scenarios"]
  },
  {
    id: "full-app-build", title: "Build a complete C# Windows application", by: "freeCodeCamp / IAmTimCorey",
    minutes: "24h series", videoId: "wfWxdh-_k_4", start: 0, category: "Full application",
    topic: "Plan data, create a WinForms user interface, add class libraries, write event handlers, persist data and debug.",
    exercise: "Build the CodeQuest ATM, loan or banking system. Implement the event handlers, run tests, get a grade and export the Visual Studio solution.",
    route: "designer", steps: ["Plan requirements and form controls", "Build your own form and handler code", "Run the app and grade realistic cases", "Export the .sln/.csproj project for native Windows testing"]
  },
  {
    id: "full-app-debug", title: "Debugging a complete C# application", by: "freeCodeCamp / IAmTimCorey",
    minutes: "Debugging chapter", videoId: "wfWxdh-_k_4", start: 58320, category: "Full application",
    topic: "Find, explain and repair errors rather than memorizing a solution.",
    exercise: "Open a system project, introduce an invalid input or broken calculation, then fix it until the assessment checks pass.",
    route: "designer", steps: ["Inspect the error", "Locate the faulty event handler", "Run again and test a new case"]
  }
];

const STORAGE = "cq-video-progress-v1";
function loadDone(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    return Array.isArray(value) ? value.filter(x => typeof x === "string" && tutorials.some(t => t.id === x)) : [];
  } catch { return []; }
}
export default function TutorialLibrary({onNavigate}: {onNavigate:(route:string)=>void}) {
  const [category,setCategory]=useState("All");
  const [selected,setSelected]=useState(tutorials[0].id);
  const [watch,setWatch]=useState(false);
  const [done,setDone]=useState<string[]>(loadDone);
  const [search,setSearch]=useState("");
  const active = tutorials.find(t=>t.id===selected) || tutorials[0];
  const videoUrl = `https://www.youtube.com/watch?v=${active.videoId}&t=${active.start}s`;
  const visible = useMemo(()=>tutorials.filter(t=>
    (category==="All"||t.category===category) &&
    (t.title+" "+t.topic+" "+t.by).toLowerCase().includes(search.toLowerCase())
  ),[category,search]);
  function select(id:string){setSelected(id);setWatch(false)}
  function markComplete(){
    setDone(current=>{
      const updated=current.includes(active.id)?current.filter(id=>id!==active.id):[...current,active.id];
      try{localStorage.setItem(STORAGE,JSON.stringify(updated))}catch{}
      return updated;
    });
  }
  return <section className="page tutorial-page" aria-label="Video tutorials">
    <div className="page-heading">
      <div>
        <p className="eyebrow">CODEQUEST / VIDEO LEARNING STUDIO</p>
        <h1>Watch. Build. Break. Fix.</h1>
        <p>Real lessons from educators, matched with C# and WinForms challenges you can try here — on a low-powered laptop or your phone.</p>
      </div>
    </div>
    <p className="tutorial-note"><LockKeyhole size={16}/> Videos are hosted by their original YouTube creators. Playing requires internet and may show YouTube's own content. No account or paid API required for the CodeQuest exercises.</p>
    <div className="tutorial-layout">
      <div className="tutorial-main">
        <div className="tutorial-player">
          {watch ? <iframe title={active.title} src={`https://www.youtube.com/embed/${active.videoId}?start=${active.start}&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> :
            <a className="tutorial-load-video" href={videoUrl} target="_blank" rel="noopener noreferrer"
              aria-label={`Watch on YouTube: ${active.title}`}>
              <Play size={42}/> <span>Watch on YouTube</span><small>{active.by} · {active.minutes}</small>
            </a>}
        </div>
        <div className="tutorial-play-options">
          <p><strong>Recommended:</strong> Watch directly on YouTube. Some creators, networks and browsers block embedded players.</p>
          <div className="tutorial-actions">
            <a className="tutorial-watch-link" href={videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/> Play on YouTube</a>
            <button type="button" onClick={()=>setWatch(value=>!value)}>{watch?"Hide embedded player":"Try embedded player"}</button>
          </div>
          {watch&&<p role="status">If you see “This content is blocked” or an unavailable-video message, select <strong>Play on YouTube</strong> above. CodeQuest cannot override a creator’s embedding restrictions.</p>}
        </div>
        <div className="tutorial-content">
          <p className="eyebrow">{active.category.toUpperCase()}</p><h2>{active.title}</h2><p>{active.topic}</p>
          <a className="tutorial-original" href={`https://www.youtube.com/watch?v=${active.videoId}&t=${active.start}s`}
              target="_blank" rel="noreferrer"><ExternalLink size={17}/> Open on YouTube if embedding is unavailable</a>
          <div className="tutorial-challenge" aria-label="Practice challenge">
            <p className="eyebrow">NOW TRY IT YOURSELF</p><h3>Tor's challenge</h3><p>{active.exercise}</p>
            <ol>{active.steps.map(s=><li key={s}>{s}</li>)}</ol>
            <div className="tutorial-actions">
              <button className="primary" onClick={()=>onNavigate(active.route)}>{active.route==="designer"?<PanelsTopLeft size={17}/>:<Code2 size={17}/>} Open {active.route==="designer"?"WinForms Studio":"Code Lab"}</button>
              <button aria-pressed={done.includes(active.id)} onClick={markComplete}><CheckCircle2 size={17}/>{done.includes(active.id)?"Practiced ✓ — undo":"I practised this"}</button>
            </div>
            <p className="muted">Marking practice is self-reported. A real app must also pass tests in the system workshop and run in native Visual Studio after export.</p>
          </div>
        </div>
      </div>
      <aside className="tutorial-sidebar">
        <label>Find a topic<input aria-label="Search tutorial videos" placeholder="Events, classes, complete app…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <label>Filter courses<select aria-label="Filter tutorial category" value={category} onChange={e=>setCategory(e.target.value)}><option>All</option><option>C# basics</option><option>WinForms</option><option>Full application</option></select></label>
        <p className="muted">{done.length} of {tutorials.length} practice exercises marked complete</p>
        <div className="tutorial-list">{visible.map(t=><button key={t.id} onClick={()=>select(t.id)} className={t.id===active.id?"active":""} aria-current={t.id===active.id?"true":undefined}>
          <span className="tutorial-item-icon">{done.includes(t.id)?<CheckCircle2 size={19}/>:<BookOpen size={19}/>}</span>
          <span><strong>{t.title}</strong><small>{t.by} · {t.minutes}</small></span>
        </button>)}{!visible.length&&<p className="muted">No video matches. Try a different topic.</p>}</div>
      </aside>
    </div>
  </section>;
}
