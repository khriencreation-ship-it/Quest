-- 1. Create the sub-tasks table
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow authenticated users to manage sub-tasks
-- (This policy matches the broad access of your tasks table)
CREATE POLICY "Allow authenticated users to manage task subtasks" 
ON public.task_subtasks 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Create an index on task_id for faster local lookups/joins
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON public.task_subtasks(task_id);
