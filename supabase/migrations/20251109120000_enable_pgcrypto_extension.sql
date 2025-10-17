-- Ensure the pgcrypto extension is available for cryptographic helpers like gen_salt and gen_random_uuid
create schema if not exists extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
