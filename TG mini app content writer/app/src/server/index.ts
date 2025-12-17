import express from "express";
import threadsRouter from "./threads";

const app = express();

app.set('trust proxy', 1);

app.use("/api/threads", threadsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

if (process.argv[1] === import.meta.url.replace("file://", "")) {
  const port = Number(process.env.PORT || 5173);
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

export default app;
