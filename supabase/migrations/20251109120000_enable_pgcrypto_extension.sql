-- Ensure the pgcrypto extension is available for cryptographic helpers like gen_salt and gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;
