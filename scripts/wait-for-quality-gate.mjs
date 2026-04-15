import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const reportTaskPath = new URL("../.scannerwork/report-task.txt", import.meta.url);
const timeoutMs = 5 * 60 * 1000;
const pollIntervalMs = 5 * 1000;

function parseProperties(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((props, line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return props;
      }

      const key = line.slice(0, separatorIndex);
      const value = line.slice(separatorIndex + 1);
      props[key] = value;
      return props;
    }, {});
}

function getAuthHeaders(token) {
  const encoded = Buffer.from(`${token}:`).toString("base64");
  return {
    Authorization: `Basic ${encoded}`,
  };
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`SonarQube API call failed (${response.status} ${response.statusText}) for ${url}`);
  }

  return response.json();
}

async function waitForAnalysis(taskUrl, token) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const payload = await fetchJson(taskUrl, token);
    const task = payload.task;

    if (!task) {
      throw new Error("SonarQube did not return a compute-engine task.");
    }

    if (task.status === "SUCCESS") {
      if (!task.analysisId) {
        throw new Error("SonarQube task succeeded but analysisId is missing.");
      }

      return task.analysisId;
    }

    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(`SonarQube background task ended with status ${task.status}.`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error("Timed out while waiting for SonarQube analysis completion.");
}

async function main() {
  const token = process.env.SONAR_TOKEN;
  if (!token) {
    throw new Error("SONAR_TOKEN is required to query the SonarQube API.");
  }

  const rawReport = await readFile(reportTaskPath, "utf8");
  const report = parseProperties(rawReport);
  const taskUrl = report.ceTaskUrl;
  const serverUrl = report.serverUrl;

  if (!taskUrl || !serverUrl) {
    throw new Error("The SonarQube report-task.txt file is incomplete.");
  }

  const analysisId = await waitForAnalysis(taskUrl, token);
  const qualityGateUrl = new URL(`/api/qualitygates/project_status?analysisId=${analysisId}`, serverUrl);
  const qualityGatePayload = await fetchJson(qualityGateUrl, token);
  const status = qualityGatePayload.projectStatus?.status;

  if (!status) {
    throw new Error("SonarQube did not return a quality gate status.");
  }

  console.log(`Quality Gate: ${status}`);

  if (status !== "OK") {
    throw new Error(`Quality Gate failed with status ${status}.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
