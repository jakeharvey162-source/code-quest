export type WorkspaceObservation = {
  page: string;
  mode: string;
  controls: number;
  selected: string;
  caption: string;
  issues: string[];
  output: string;
};
// Only app state: no screen capture, microphone recording or password values.
export function observeWorkspace(detail: WorkspaceObservation) {
  window.dispatchEvent(new CustomEvent("cq-workspace-observation", { detail }));
}
