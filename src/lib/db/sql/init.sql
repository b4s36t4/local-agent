CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT,
  response TEXT,
  parent_conversation INTEGER,
  FOREIGN KEY (parent_conversation) REFERENCES conversations(id)
);
create virtual table code_indexes using vec0(
  file_embedding float[768],
  file_name TEXT,
  file_path TEXT,
  line_start INTEGER NULL,
  line_end INTEGER NULL
);