# GitHub Release Checklist

Before pushing to GitHub, confirm:

## Security Check

- [ ] `.gitignore` created
- [ ] `application.properties` is in `.gitignore`
- [ ] `application.properties.example` created (without real keys)
- [ ] No AWS credentials files (.csv)
- [ ] Run `git status` to confirm no sensitive files

## Documentation Check

- [ ] README.md is complete and accurate
- [ ] Configuration instructions are clear
- [ ] Usage instructions are complete

## Testing Check

- [ ] Project starts normally
- [ ] Upload feature works
- [ ] Search feature works
- [ ] Q&A feature works

## Push Steps

```powershell
# 1. Initialize git (if not already done)
git init

# 2. Add all files
git add .

# 3. Review files to be committed (confirm no sensitive info)
git status

# 4. Commit
git commit -m "Initial commit: AI Knowledge Base System"

# 5. After creating GitHub repo, add remote
git remote add origin https://github.com/YOUR_USERNAME/ai-knowledge-base.git

# 6. Push
git branch -M main
git push -u origin main
```

## Security Reminder

If you accidentally push sensitive information:

1. **Immediately delete the repository**
2. **Immediately replace all API keys**:
   - AWS: Delete old key in IAM, create new key
   - OpenAI: Delete old key in OpenAI dashboard, create new key
3. **Check AWS CloudTrail** for any abnormal activity

---

**Delete this file after completing the checklist!**

