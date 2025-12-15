const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");


const app = express();
app.use(express.json());

const TIMEOUT = 5000;

//cors middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");   
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post("/run", async (req, res) => {
  const { code, language, testCases } = req.body;
  const id = uuid();
  const dir = path.join(__dirname, "tmp", id);
  fs.mkdirSync(dir, { recursive: true });

  let file, command, args;

  if (language === "javascript") {
    file = "code.js";
    command = "node";
    args = [file];
  }

  if (language === "python") {
    file = "code.py";
    command = "python";
    args = [file];
  }

  if (language === "cpp") {
    file = "code.cpp";
    fs.writeFileSync(path.join(dir, file), code);

    // compile first
    try {
      require("child_process").execSync("g++ code.cpp -o code", { cwd: dir });
    } catch (e) {
      return res.json({
        results: [{ passed: false, error: e.stderr?.toString() }]
      });
    }

    command = "./code";
    args = [];
  }

  if (language !== "cpp") {
    fs.writeFileSync(path.join(dir, file), code);
  }

  const results = [];

  for (let test of testCases) {
    await new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: dir,
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", () => {
        const actual = stdout.trim();
        const expected = test.output.trim();

        results.push({
          input: test.input,
          expected,
          actual,
          passed: actual === expected,
          error: stderr || null
        });

        resolve();
      });

      // ✅ THIS IS THE KEY FIX
      child.stdin.write(test.input);
      child.stdin.end();
    });
  }

  fs.rmSync(dir, { recursive: true, force: true });
  res.json({ results });
});


app.listen(5000, () => console.log("Backend running on 5000"));
