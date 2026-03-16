-- Link orphaned resume_analyses to saved_resumes by matching file_name to title (with extension variants)
UPDATE resume_analyses ra
SET resume_id = sr.id
FROM saved_resumes sr
WHERE ra.resume_id IS NULL
  AND ra.user_id IS NOT NULL
  AND ra.user_id = sr.user_id
  AND (
    ra.file_name = sr.title
    OR ra.file_name = sr.title || '.pdf'
    OR ra.file_name = sr.title || '.docx'
    OR ra.file_name = sr.title || '.doc'
    OR ra.file_name = sr.title || '.txt'
  );