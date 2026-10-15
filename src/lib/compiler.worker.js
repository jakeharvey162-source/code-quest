let module, compilation;
self.onmessage = async (event) => {
  try {
    if (!module) {
      self.postMessage({ type: "status", text: "Loading the C# compiler…" });
      const runtime = await import(/* @vite-ignore */ "/compiler/index.js");
      module = await runtime.WasmSharpModule.initializeAsync({
        disableWebWorker: false,
        onDownloadResourceProgress: (loaded, total) =>
          self.postMessage({
            type: "status",
            text: `Loading compiler ${loaded}/${total}…`,
          }),
      });
      self.postMessage({ type: "status", text: "Preparing the first C# run…" });
      const warmup = await module.createCompilationAsync(
        "using System; Console.WriteLine(0);",
      );
      const ready = await warmup.run();
      if (!ready.success)
        throw new Error(
          "The C# runtime could not finish its startup check. Reload and try again.",
        );
    }
    self.postMessage({ type: "compiling" });
    if (compilation) await compilation.recompileAsync(event.data.code);
    else compilation = await module.createCompilationAsync(event.data.code);
    const diagnostics = await compilation.getDiagnosticsAsync();
    if (diagnostics.some((d) => String(d.severity).toLowerCase() === "error")) {
      self.postMessage({
        type: "result",
        result: { success: false, stdOut: "", stdErr: "", diagnostics },
      });
      return;
    }
    self.postMessage({ type: "running" });
    const result = await compilation.run();
    self.postMessage({
      type: "result",
      result: {
        ...result,
        stdOut: result.stdOut?.slice(0, 250000),
        stdErr: result.stdErr?.slice(0, 250000),
      },
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
