# 🔧 Troubleshooting Guide

## 🚨 OpenAI API Quota Exceeded (Error 429)

### **Problem Description**

You're seeing this error in the console:

```
api.openai.com/v1/chat/completions:1 Failed to load resource: the server responded with a status of 429 ()
hook.js:608 Match Analysis error: RateLimitError: 429 You exceeded your current quota, please check your plan and billing details.
```

### **What This Means**

- **Error 429** = Rate limit exceeded or quota reached
- Your OpenAI API account has hit its usage limits
- The "Analyze Now" function cannot make API calls to OpenAI

### **Root Causes**

1. **Free Tier Limit Reached**: OpenAI free tier gives $5/month credit
2. **Rate Limiting**: Too many API calls in a short time
3. **Billing Issues**: Payment method expired or insufficient funds
4. **Account Suspension**: Terms of service violation

### **Immediate Solutions**

#### **1. Check Your OpenAI Account**

- Visit [platform.openai.com](https://platform.openai.com)
- Go to "Billing" → "Usage"
- Check your current usage and billing status
- Verify your payment method

#### **2. Use Demo Mode (Temporary Workaround)**

- Click the **"Demo Mode"** button in the Analyze Now page
- This shows sample analysis results without API calls
- Perfect for testing the interface while resolving quota issues

#### **3. Wait for Reset**

- Free tier resets monthly (usually on the 1st)
- Paid plans may have different reset schedules
- Check your billing cycle in OpenAI dashboard

### **Long-term Solutions**

#### **1. Upgrade OpenAI Plan**

- Free tier: $5/month credit
- Pay-as-you-go: $0.002 per 1K tokens
- Team plan: Higher limits and better support

#### **2. Optimize API Usage**

- Limit analysis to essential documents
- Use shorter text inputs
- Implement caching for repeated analyses

#### **3. Alternative AI Services**

- Consider other AI providers (Claude, Gemini)
- Implement fallback analysis methods
- Use local AI models for basic analysis

### **How to Check Your Current Status**

#### **In the App**

- Go to Analyze Now page
- Check the "API Calls Remaining" counter
- Look for error messages in the interface

#### **In OpenAI Dashboard**

- Visit [platform.openai.com/usage](https://platform.openai.com/usage)
- Check "Usage this month"
- Verify "Current plan" and "Billing cycle"

### **Prevention Tips**

1. **Monitor Usage**: Check your OpenAI dashboard regularly
2. **Set Alerts**: Configure usage notifications
3. **Budget Management**: Set spending limits
4. **Efficient Usage**: Only analyze when necessary

### **Testing Without API**

#### **Demo Mode Features**

- ✅ Sample CV-JD matching
- ✅ Skills analysis
- ✅ Recommendations
- ✅ Match scoring
- ❌ No real AI analysis
- ❌ No API cost

#### **When to Use Demo Mode**

- API quota exceeded
- Testing the interface
- Demonstrating features
- Development/testing

### **Getting Help**

#### **OpenAI Support**

- [OpenAI Help Center](https://help.openai.com/)
- [OpenAI Community](https://community.openai.com/)
- [OpenAI Status](https://status.openai.com/)

#### **Project Support**

- Check the main README.md
- Review OPENAI_INTEGRATION.md
- Check ENVIRONMENT_SETUP.md

### **Quick Fix Checklist**

- [ ] Check OpenAI account status
- [ ] Verify billing information
- [ ] Check usage limits
- [ ] Try demo mode
- [ ] Wait for monthly reset
- [ ] Consider plan upgrade
- [ ] Contact OpenAI support if needed

---

**Note**: The app is working correctly - the issue is with OpenAI API access, not the application code. Use demo mode while resolving the quota issue.
