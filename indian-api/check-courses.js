const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./recipe.sqlite");
db.all("SELECT Course, COUNT(*) as count FROM recipe WHERE Course IS NOT NULL AND Course != '' GROUP BY Course ORDER BY count DESC", (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
  db.close();
});
