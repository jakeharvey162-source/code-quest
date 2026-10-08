export type RunResult = {
  success: boolean;
  stdOut: string | null;
  stdErr: string | null;
  diagnostics: {
    id: string;
    message: string;
    severity: string;
    location?: { start: number; length: number };
  }[];
};
let worker: Worker | undefined;
let pending = false;
let cancelCurrent: (() => void) | undefined;
export function cancelRun() {
  cancelCurrent?.();
}
export function runCSharp(
  code: string,
  onStatus: (text: string) => void = () => {},
): Promise<RunResult> {
  if (pending)
    return Promise.reject(
      new Error(
        "A program is already running. Stop it before starting another.",
      ),
    );
  if (code.length > 50000)
    return Promise.reject(new Error("Keep programs below 50,000 characters."));
  pending = true;
  try {
    worker ??= new Worker(new URL("./compiler.worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    pending = false;
    worker = undefined;
    return Promise.reject(new Error("The C# compiler could not start in this browser. Reload the app and try again."));
  }
  const current = worker;
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      clearTimeout(timer);
      pending = false;
      cancelCurrent = undefined;
      current.onmessage = null;
      current.onerror = null;
    };
    const fail = (message: string) => {
      current.terminate();
      worker = undefined;
      finish();
      reject(new Error(message));
    };
    cancelCurrent = () => fail("Run stopped. Your code is safe in the editor.");
    timer = setTimeout(
      () =>
        fail(
          "Compiler loading timed out. Check your connection and try again.",
        ),
      90000,
    );
    current.onerror = (event) =>
      fail(event.message || "The compiler could not start.");
    current.onmessage = (event) => {
      if (event.data.type === "status") onStatus(event.data.text);
      else if (event.data.type === "running") {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            fail(
              "Program stopped after 10 seconds. Check for an infinite loop.",
            ),
          10000,
        );
        onStatus("Compiling and running C#…");
      } else if (event.data.type === "result") {
        finish();
        resolve(event.data.result);
      } else if (event.data.type === "error") fail(event.data.message);
    };
    try {
      current.postMessage({ code });
    } catch {
      fail("The compiler did not accept the program. Reload and try again; your editor content is preserved.");
    }
  });
}
