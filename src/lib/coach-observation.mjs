export function observationReply(now, before) {
  if (!before || now.page !== before.page) return null;
  if (
    now.output !== before.output &&
    /\bCS\d{4}\b|failed|error|No handler|Event wired/i.test(now.output)
  )
    return {
      mood: "concerned",
      text: `I saw the run hit a problem: ${now.output}. Check the first error before changing anything else.`,
      roast:
        "Your button called for backup and nobody answered. Let's fix the wiring.",
    };
  if (now.mode !== before.mode && now.mode === "Running Form1")
    return {
      mood: "happy",
      text: "Your app window is open. Enter a value, click your Button, and check the result. Closing it returns to your saved design.",
      roast: "The form looks alive. Now make the button earn its keep.",
    };
  if (now.output !== before.output && /executed\./.test(now.output))
    return {
      mood: "happy",
      text: `Your C# handler ran: ${now.output}. Try an empty input and an invalid number next. Passing one example is only the start.`,
      roast: "Okay, that code cooked. Now test the awkward inputs.",
    };
  if (now.controls > before.controls)
    return {
      mood: "cheeky",
      text: `I saw you add ${now.selected || "a control"}. ${now.caption ? `The visible caption is “${now.caption}”. ` : ""}Set (Name) for your C# reference and Text for what your user reads.`,
      roast: "Fresh control, fresh responsibility. Give it a job.",
    };
  if (
    now.selected === before.selected &&
    now.caption !== before.caption &&
    now.caption
  )
    return {
      mood: "happy",
      text: `I saw the caption change to “${now.caption}”. Your C# identifier is still ${now.selected}. That's the difference between Text and (Name).`,
      roast: "Now your label has something useful to say.",
    };
  return null;
}
export function describeObservation(now) {
  if (!now) return "Waiting for workspace activity.";
  return `${now.mode}${now.page === "designer" ? ` · ${now.controls} controls` : ""}${now.selected ? ` · selected ${now.selected}` : ""}${now.caption ? ` · caption “${now.caption}”` : ""}`;
}
