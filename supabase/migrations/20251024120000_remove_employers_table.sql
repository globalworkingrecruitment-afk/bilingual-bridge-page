-- Remove employers table to keep candidate contact data within existing structure

-- Drop policy and trigger if they exist before removing the table
DROP POLICY IF EXISTS "Authenticated can manage employers" ON public.employers;
DROP TRIGGER IF EXISTS update_employers_updated_at ON public.employers;

-- Drop the employers table if it was previously created
DROP TABLE IF EXISTS public.employers;
