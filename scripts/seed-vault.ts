import postgres from "postgres";

const cronSecret = Deno.env.get("CRON_SECRET");
if (!cronSecret) {
  throw new Error("CRON_SECRET is required for seeding vault");
}
const sql = postgres("postgresql://postgres:postgres@127.0.0.1:54322/postgres");

const secrets = {
  project_url: "http://kong:8000",
  cron_secret: cronSecret,
};

await sql.begin(async (tx) => {
  for (const [name, value] of Object.entries(secrets)) {
    await tx`delete from vault.secrets where name = ${name}`;
    await tx`select vault.create_secret(${value}, ${name})`;
  }
});

await sql.end();
console.log(
  `Added the following secrets to the vault: ${Object.keys(secrets).join(", ")}`,
);
